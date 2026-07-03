import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
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
      <p className="font-semibold text-white mt-0.5">{payload[0].value} nuevos</p>
    </div>
  );
}

interface Props {
  data: PuntoTiempo[] | undefined;
}

/** Bare — vive dentro de Widget.tsx (ClientesNuevosWidget). Solo se usa ahí. */
export default function ClientesNuevosChart({ data }: Props) {
  if (!data?.length) {
    return <p className="py-16 text-center text-sm text-gray-400">Sin clientes nuevos en este período</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={8}>
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
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#3FD17A18" }} />
        <Bar
          dataKey="cantidad"
          fill="#3FD17A"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
