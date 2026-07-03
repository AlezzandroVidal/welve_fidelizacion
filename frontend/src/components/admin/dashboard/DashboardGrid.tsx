import { useState, type ReactNode } from "react";
import type { WidgetSize } from "./Widget";

const STORAGE_KEY = "welve_dashboard_layout";

const SIZE_CLASS: Record<WidgetSize, string> = {
  sm: "lg:col-span-1",
  md: "lg:col-span-2",
  lg: "lg:col-span-3",
  xl: "lg:col-span-4",
};

export function loadLayout(defaultOrder: string[]): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultOrder;
    const saved: string[] = JSON.parse(raw);
    // Si se agregó/quitó un widget desde la última visita, reconcilia en vez
    // de perder el layout guardado: conserva el orden guardado + agrega los
    // nuevos al final, descarta los que ya no existen.
    const known = saved.filter((id) => defaultOrder.includes(id));
    const nuevos = defaultOrder.filter((id) => !known.includes(id));
    return [...known, ...nuevos];
  } catch {
    return defaultOrder;
  }
}

export function saveLayout(order: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

export function resetLayout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

interface DashboardGridProps {
  order: string[];
  sizes: Record<string, WidgetSize>;
  editMode: boolean;
  onReorder: (order: string[]) => void;
  renderWidget: (id: string, editMode: boolean) => ReactNode;
}

export default function DashboardGrid({ order, sizes, editMode, onReorder, renderWidget }: DashboardGridProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setOverId(null);
      return;
    }
    const next = [...order];
    const from = next.indexOf(draggedId);
    const to = next.indexOf(targetId);
    next.splice(from, 1);
    next.splice(to, 0, draggedId);
    onReorder(next);
    setDraggedId(null);
    setOverId(null);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {order.map((id) => (
        <div
          key={id}
          draggable={editMode}
          onDragStart={() => setDraggedId(id)}
          onDragOver={(e) => {
            if (!editMode) return;
            e.preventDefault();
            if (overId !== id) setOverId(id);
          }}
          onDragLeave={() => setOverId((cur) => (cur === id ? null : cur))}
          onDrop={() => handleDrop(id)}
          onDragEnd={() => { setDraggedId(null); setOverId(null); }}
          className={[
            SIZE_CLASS[sizes[id] ?? "sm"],
            "transition-opacity duration-150",
            draggedId === id ? "opacity-50" : "",
            overId === id && draggedId && draggedId !== id ? "outline outline-2 outline-dashed outline-welve-400 outline-offset-2 rounded-2xl" : "",
          ].join(" ")}
        >
          {renderWidget(id, editMode)}
        </div>
      ))}
    </div>
  );
}
