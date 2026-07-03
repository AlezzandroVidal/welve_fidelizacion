import { useState } from "react";
import type { PuntoTiempo } from "../../api/metricas";

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const WEEKS = 12;

function colorForCount(n: number): string {
  if (!n) return "#E8E4F7";
  if (n <= 2) return "#C4B5FD";
  if (n <= 5) return "#A78BFA";
  if (n <= 10) return "#7C5CFC";
  return "#5B3FD4";
}

// Lunes-primero: getDay() es 0=domingo..6=sábado -> (d+6)%7 = 0=lunes..6=domingo
function mondayFirstIdx(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function buildGrid(data: PuntoTiempo[]) {
  const map = new Map(data.map((d) => [d.fecha, d.cantidad]));
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayIdx = mondayFirstIdx(today);

  const cells: { date: string; count: number; weekIdx: number; dayIdx: number; esInicioMes: boolean }[] = [];

  for (let w = WEEKS - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - w * 7 - (todayIdx - d));
      if (dt > today) continue;
      const key = dt.toISOString().slice(0, 10);
      cells.push({
        date: key,
        count: map.get(key) ?? 0,
        weekIdx: WEEKS - 1 - w,
        dayIdx: d,
        esInicioMes: dt.getDate() <= 7,
      });
    }
  }
  return cells;
}

function fmtTooltipFecha(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
}

interface TooltipState { date: string; count: number; x: number; y: number }

interface Props {
  data: PuntoTiempo[] | undefined;
}

/** Bare — vive dentro de Widget.tsx (CalendarioActividadWidget). Solo se usa ahí. */
export default function ActivityHeatmap({ data }: Props) {
  const [tip, setTip] = useState<TooltipState | null>(null);

  const cells = buildGrid(data ?? []);
  const CELL = 14;
  const GAP = 3;
  const step = CELL + GAP;
  const LEFT_PAD = 20;

  const meses = new Map<number, string>();
  for (const c of cells) {
    if (c.esInicioMes && !meses.has(c.weekIdx)) {
      meses.set(c.weekIdx, MESES[new Date(c.date + "T12:00:00").getMonth()]);
    }
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <svg
          width={WEEKS * step - GAP + LEFT_PAD}
          height={7 * step - GAP + 14}
          className="overflow-visible"
          onMouseLeave={() => setTip(null)}
        >
          {[...meses.entries()].map(([weekIdx, mes]) => (
            <text key={weekIdx} x={LEFT_PAD + weekIdx * step} y={8} fontSize={9} fill="#9CA3AF" className="capitalize">
              {mes}
            </text>
          ))}

          {DAYS.map((day, i) => (
            <text key={day} x={0} y={14 + i * step + CELL - 1} fontSize={9} fill="#9CA3AF">{day}</text>
          ))}

          {cells.map((cell) => (
            <rect
              key={cell.date}
              x={LEFT_PAD + cell.weekIdx * step}
              y={14 + cell.dayIdx * step}
              width={CELL}
              height={CELL}
              rx={3}
              fill={colorForCount(cell.count)}
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
        {["#E8E4F7", "#C4B5FD", "#A78BFA", "#7C5CFC", "#5B3FD4"].map((c) => (
          <div key={c} className="h-3 w-3 rounded-sm" style={{ background: c }} />
        ))}
        <span className="text-xs text-gray-400">Más</span>
      </div>

      {tip && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl bg-[#1E1B2E] px-3 py-2 text-sm shadow-xl -translate-x-1/2 -translate-y-full capitalize"
          style={{ left: tip.x, top: tip.y }}
        >
          <p className="text-gray-400 text-xs">{fmtTooltipFecha(tip.date)}</p>
          <p className="font-semibold text-white mt-0.5">{tip.count} canje{tip.count === 1 ? "" : "s"}</p>
        </div>
      )}
    </div>
  );
}
