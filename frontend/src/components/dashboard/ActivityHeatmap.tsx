import { useState } from "react";
import type { PuntoTiempo } from "../../api/metricas";

const DAYS = ["D", "L", "M", "X", "J", "V", "S"];
const WEEKS = 12;

function colorForCount(n: number, max: number): string {
  if (!n) return "#F0EEF9";
  const intensity = Math.min(n / Math.max(max, 1), 1);
  const stops = ["#E8E4F7", "#C5B9F5", "#A38EF0", "#7C5CFC"];
  const idx = Math.floor(intensity * (stops.length - 1));
  return stops[Math.min(idx, stops.length - 1)];
}

function buildGrid(data: PuntoTiempo[]) {
  const map = new Map(data.map((d) => [d.fecha, d.cantidad]));
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const cells: { date: string; count: number; weekIdx: number; dayIdx: number }[] = [];

  for (let w = WEEKS - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - w * 7 - (6 - d));
      const key = dt.toISOString().slice(0, 10);
      if (dt > today) continue;
      cells.push({ date: key, count: map.get(key) ?? 0, weekIdx: WEEKS - 1 - w, dayIdx: d });
    }
  }
  return cells;
}

function Skeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <div className="h-4 w-40 rounded bg-gray-100 animate-pulse mb-4" />
      <div className="h-28 rounded-lg bg-gray-100 animate-pulse" />
    </div>
  );
}

interface TooltipState { date: string; count: number; x: number; y: number }

interface Props {
  data: PuntoTiempo[] | undefined;
  isLoading: boolean;
}

export default function ActivityHeatmap({ data, isLoading }: Props) {
  const [tip, setTip] = useState<TooltipState | null>(null);

  if (isLoading) return <Skeleton />;

  const cells = buildGrid(data ?? []);
  const max = Math.max(...cells.map((c) => c.count), 1);
  const CELL = 14;
  const GAP = 3;
  const step = CELL + GAP;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card relative">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Actividad de canjes — últimas 12 semanas</h2>

      <div className="overflow-x-auto">
        <svg
          width={WEEKS * step - GAP + 24}
          height={7 * step - GAP + 18}
          className="overflow-visible"
          onMouseLeave={() => setTip(null)}
        >
          {/* Day labels */}
          {DAYS.map((day, i) => (
            <text key={day} x={0} y={i * step + CELL - 1} fontSize={9} fill="#9CA3AF">{day}</text>
          ))}

          {/* Cells */}
          {cells.map((cell) => (
            <rect
              key={cell.date}
              x={24 + cell.weekIdx * step}
              y={cell.dayIdx * step}
              width={CELL}
              height={CELL}
              rx={3}
              fill={colorForCount(cell.count, max)}
              className="cursor-pointer transition-opacity hover:opacity-80"
              onMouseEnter={(e) => {
                const rect = (e.target as SVGRectElement).getBoundingClientRect();
                setTip({ date: cell.date, count: cell.count, x: rect.left + 7, y: rect.top - 8 });
              }}
            />
          ))}
        </svg>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-400">Menos</span>
        {["#F0EEF9", "#E8E4F7", "#C5B9F5", "#A38EF0", "#7C5CFC"].map((c) => (
          <div key={c} className="h-3 w-3 rounded-sm" style={{ background: c }} />
        ))}
        <span className="text-xs text-gray-400">Más</span>
      </div>

      {tip && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl bg-gray-900 px-3 py-2 text-sm shadow-xl -translate-x-1/2 -translate-y-full"
          style={{ left: tip.x, top: tip.y }}
        >
          <p className="text-gray-400 text-xs">{tip.date}</p>
          <p className="font-semibold text-white mt-0.5">{tip.count} canjes</p>
        </div>
      )}
    </div>
  );
}
