import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { PuntoTiempo } from "../../api/metricas";

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
      <p className="font-semibold text-white mt-0.5">{payload[0].value} nuevos</p>
    </div>
  );
}

function Skeleton() {
  return <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />;
}

interface Props {
  data: PuntoTiempo[] | undefined;
  isLoading: boolean;
}

export default function ClientesNuevosChart({ data, isLoading }: Props) {
  if (isLoading) return <Skeleton />;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card h-full">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Clientes nuevos — últimos 30 días</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={8}>
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#3FD17A18" }} />
          <Bar
            dataKey="cantidad"
            fill="#3FD17A"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
