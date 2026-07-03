import { ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { SkeletonRow } from "./Skeleton";

/* ── Primitives ─────────────────────────────────────────────────────────── */

function Root({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[16px] bg-white overflow-hidden shadow-table ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
    </div>
  );
}

function Header({ cols }: { cols: Array<{ label: string; sortable?: boolean; sorted?: "asc" | "desc" | null; onSort?: () => void; className?: string }> }) {
  return (
    <thead>
      <tr className="border-b border-gray-100 bg-[#F5F3FF]">
        {cols.map((col) => (
          <th
            key={col.label}
            onClick={col.sortable ? col.onSort : undefined}
            className={[
              "px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider",
              col.sortable ? "cursor-pointer select-none hover:text-welve-600 transition-colors" : "",
              col.className ?? "",
            ].join(" ")}
          >
            <span className="inline-flex items-center gap-1">
              {col.label}
              {col.sortable && (
                <span className="flex flex-col">
                  <ChevronUp  size={9} className={col.sorted === "asc"  ? "text-welve-500" : "text-gray-300"} />
                  <ChevronDown size={9} className={col.sorted === "desc" ? "text-welve-500" : "text-gray-300"} />
                </span>
              )}
            </span>
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-gray-50">{children}</tbody>;
}

function Row({
  children, onClick, className = "",
}: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr
      onClick={onClick}
      className={[
        "transition-colors duration-100",
        onClick ? "cursor-pointer hover:bg-welve-50/50" : "",
        className,
      ].join(" ")}
    >
      {children}
    </tr>
  );
}

function Cell({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3.5 ${className}`}>{children}</td>;
}

function Loading({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <Body>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </Body>
  );
}

function Empty({
  icon, message, action,
}: { icon?: ReactNode; message: string; action?: ReactNode }) {
  return (
    <tbody>
      <tr>
        <td colSpan={99} className="py-20 text-center">
          {icon && <div className="mb-3 flex justify-center text-gray-200">{icon}</div>}
          <p className="text-sm font-medium text-gray-400">{message}</p>
          {action && <div className="mt-4">{action}</div>}
        </td>
      </tr>
    </tbody>
  );
}

export const Table = { Root, Header, Body, Row, Cell, Loading, Empty };
