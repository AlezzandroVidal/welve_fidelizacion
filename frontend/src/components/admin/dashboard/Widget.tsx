import type { ReactNode } from "react";
import { GripVertical, RefreshCw, AlertTriangle } from "lucide-react";

export type WidgetSize = "sm" | "md" | "lg" | "xl";

interface WidgetProps {
  title: string;
  icon?: React.ElementType;
  editMode?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onRefresh?: () => void;
  headerExtra?: ReactNode;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
  children: ReactNode;
}

function WidgetSkeleton() {
  return (
    <div className="space-y-3 p-1">
      <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
      <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}

export default function Widget({
  title, icon: Icon, editMode, loading, error, onRetry, onRefresh, headerExtra, dragHandleProps, children,
}: WidgetProps) {
  return (
    <div className={`flex h-full flex-col rounded-2xl bg-white p-5 shadow-card ${editMode ? "ring-1 ring-welve-200" : ""}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {editMode && (
            <span {...dragHandleProps} className="cursor-grab text-gray-300 hover:text-welve-500 active:cursor-grabbing">
              <GripVertical size={16} />
            </span>
          )}
          {Icon && <Icon size={16} className="flex-shrink-0 text-welve-500" />}
          <h2 className="truncate text-sm font-semibold text-gray-700">{title}</h2>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {headerExtra}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-welve-500"
              aria-label="Actualizar"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <WidgetSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <AlertTriangle size={22} className="text-red-400" />
            <p className="text-sm text-gray-500">No se pudo cargar este widget</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="rounded-lg bg-welve-50 px-3 py-1.5 text-xs font-semibold text-welve-600 hover:bg-welve-100"
              >
                Reintentar
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
