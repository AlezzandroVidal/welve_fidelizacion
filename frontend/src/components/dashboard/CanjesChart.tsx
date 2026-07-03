import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { PuntoTiempo } from "../../api/metricas";

function fmtFecha(f: string) {
  const d = new Date(f + "T12:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtFechaTooltip(f: string) {
  const d = new Date(f + "T12:00:00");
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "long" });
}

 
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1E1B2E] px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400 text-xs">{fmtFechaTooltip(label)}</p>
      <p className="font-semibold text-white mt-0.5">{payload[0].value} canjes</p>
    </div>
  );
}

interface Props {
  data: PuntoTiempo[] | undefined;
}

/** Bare — vive dentro de Widget.tsx (GraficoCanjesWidget), que ya provee
 * card/título/loading. Solo se usa ahí (ver DashboardPage). */
export default function CanjesChart({ data }: Props) {
  if (!data?.length) {
    return <p className="py-16 text-center text-sm text-gray-400">Sin canjes registrados en este período</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="canjesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7C5CFC" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis
          dataKey="fecha"
          tickFormatter={fmtFecha}
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
          interval={Math.max(0, Math.floor(data.length / 6) - 1)}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#7C5CFC", strokeWidth: 1, strokeDasharray: "4 2" }} />
        <Area
          type="monotone"
          dataKey="cantidad"
          stroke="#7C5CFC"
          strokeWidth={2}
          fill="url(#canjesGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#7C5CFC", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
