import type { TopCupon } from "../../api/metricas";

const TIPO_LABEL: Record<string, string> = {
  porcentual:      "%",
  monto_fijo:      "S/",
  producto_gratis: "Free",
  dos_por_uno:     "2×1",
  n_por_m:         "NxM",
  envio_gratis:    "Envío",
  personalizado:   "Custom",
};

const TIPO_COLOR: Record<string, string> = {
  porcentual:      "bg-blue-100 text-blue-700",
  monto_fijo:      "bg-green-100 text-green-700",
  producto_gratis: "bg-welve-100 text-welve-700",
  dos_por_uno:     "bg-orange-100 text-orange-700",
  n_por_m:         "bg-orange-100 text-orange-700",
  envio_gratis:    "bg-purple-100 text-purple-700",
  personalizado:   "bg-gray-100 text-gray-700",
};

function Skeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card space-y-4">
      <div className="h-4 w-40 rounded bg-gray-100 animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 w-full rounded bg-gray-100 animate-pulse" />
          <div className="h-2 w-full rounded-full bg-gray-100 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

interface Props {
  data: TopCupon[] | undefined;
  isLoading: boolean;
}

export default function TopCupones({ data, isLoading }: Props) {
  if (isLoading) return <Skeleton />;

  const max = Math.max(...(data ?? []).map((c) => c.usos_actuales), 1);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card h-full">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Top cupones más canjeados</h2>

      {!data?.length ? (
        <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
      ) : (
        <div className="space-y-4">
          {data.map((c) => (
            <div key={c.cupon_id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-sm font-medium text-gray-800">{c.nombre}</span>
                  <span className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${TIPO_COLOR[c.tipo] ?? "bg-gray-100 text-gray-600"}`}>
                    {TIPO_LABEL[c.tipo] ?? c.tipo}
                  </span>
                </div>
                <span className="ml-2 flex-shrink-0 text-sm font-semibold text-gray-900 tabular-nums">{c.usos_actuales}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-welve-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-welve-500 transition-all duration-500 ease-out"
                  style={{ width: `${(c.usos_actuales / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
