import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { PuntoTiempo } from "../../api/metricas";

function Skeleton() {
  return <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />;
}

function fmtFecha(f: string) {
  const d = new Date(f + "T12:00:00");
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-gray-900 px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400 text-xs">{fmtFecha(label)}</p>
      <p className="font-semibold text-white mt-0.5">{payload[0].value} canjes</p>
    </div>
  );
}

interface Props {
  data: PuntoTiempo[] | undefined;
  isLoading: boolean;
}

export default function CanjesChart({ data, isLoading }: Props) {
  if (isLoading) return <Skeleton />;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card h-full">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Canjes por día — últimos 30 días</h2>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
            interval="preserveStartEnd"
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
    </div>
  );
}
