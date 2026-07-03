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

const POSICION_COLOR = ["text-amber-500", "text-gray-400", "text-orange-700"];

interface Props {
  data: TopCupon[] | undefined;
  onSelect?: (cuponId: string) => void;
}

/** Bare — vive dentro de Widget.tsx (TopCuponesWidget). Solo se usa ahí. */
export default function TopCupones({ data, onSelect }: Props) {
  if (!data?.length) {
    return <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>;
  }

  const max = Math.max(...data.map((c) => c.usos_actuales), 1);

  return (
    <div className="space-y-4">
      {data.map((c, i) => (
        <button
          key={c.cupon_id}
          onClick={() => onSelect?.(c.cupon_id)}
          className="block w-full text-left transition-opacity hover:opacity-80"
        >
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-4 flex-shrink-0 text-xs font-black ${POSICION_COLOR[i] ?? "text-gray-300"}`}>{i + 1}</span>
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
        </button>
      ))}
    </div>
  );
}
