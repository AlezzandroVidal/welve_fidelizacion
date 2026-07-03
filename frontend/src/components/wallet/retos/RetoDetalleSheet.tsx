import { useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Gift, Target, Calendar, Clock } from "lucide-react";
import { Sheet } from "../../ui";
import TerminosAccordion from "../cupon-detalle/TerminosAccordion";
import { descripcionCondicion, comoCompletarlo } from "../../../utils/retos";
import type { CuponResumen } from "../../../api/wallet";
import type { RetoCardData } from "./RetoCard";

function formatValor(c: CuponResumen): string {
  switch (c.tipo) {
    case "porcentual": return `${c.valor}% OFF`;
    case "monto_fijo": return `S/${c.valor} OFF`;
    case "dos_por_uno": return "2x1";
    case "n_por_m": return "PROMO";
    case "envio_gratis": return "ENVÍO GRATIS";
    case "personalizado": return "PROMO";
    default: return "GRATIS";
  }
}

function fmtFecha(d: string) {
  return new Date(d).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
}

const CIRCULOS_MAX = 20;

interface Props {
  reto: RetoCardData | null;
  onClose: () => void;
  onReclamar?: () => void;
  reclamando?: boolean;
}

export default function RetoDetalleSheet({ reto, onClose, onReclamar, reclamando }: Props) {
  const open = !!reto;
  // Retiene el último reto mostrado mientras el Sheet anima su cierre, para
  // que el panel no quede vacío a mitad de la transición de salida.
  const ultimoRef = useRef<RetoCardData | null>(null);
  if (reto) ultimoRef.current = reto;
  const data = reto ?? ultimoRef.current;

  if (!data) return <Sheet open={open} onClose={onClose}>{null}</Sheet>;

  const recompensa = data.cuponRecompensa;
  const esPorVisitas = data.condicionTipo === "num_visitas" || data.condicionTipo === "visitas_en_periodo";
  const mostrarCirculos = esPorVisitas && data.meta <= CIRCULOS_MAX;
  const urgente = data.diasRestantes <= 7 && !data.completado;

  const estadoLabel = data.completado
    ? "Completado"
    : data.diasRestantes <= 0
    ? "Expirado"
    : "En progreso";
  const estadoColor = data.completado
    ? "bg-green-50 text-green-700"
    : data.diasRestantes <= 0
    ? "bg-gray-100 text-gray-500"
    : "bg-welve-50 text-welve-700";

  return (
    <Sheet open={open} onClose={onClose} title={data.nombre} subtitle={data.empresaNombre}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-welve-50">
            <Target size={26} className="text-welve-500" />
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${estadoColor}`}>{estadoLabel}</span>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-gray-800">
            Has completado {data.progresoActual} de las {data.meta} {esPorVisitas ? "visitas" : "unidades"} requeridas
          </p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${data.completado ? "bg-green-500" : "bg-welve-500"}`}
              style={{ width: `${Math.min(data.porcentaje, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-right text-xs font-bold text-gray-400">{Math.round(data.porcentaje)}%</p>

          {mostrarCirculos && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Array.from({ length: data.meta }).map((_, i) => (
                <span
                  key={i}
                  className={`h-4 w-4 rounded-full ${i < data.progresoActual ? "bg-welve-500" : "border-2 border-gray-200"}`}
                />
              ))}
            </div>
          )}
        </div>

        {recompensa && (
          <div className="overflow-hidden rounded-2xl border border-welve-100 bg-welve-50/60">
            {recompensa.imagenUrl && (
              <img src={recompensa.imagenUrl} alt="" className="h-32 w-full object-cover" />
            )}
            <div className="space-y-2 p-4">
              <p className="text-3xl font-black leading-none text-welve-600">{formatValor(recompensa)}</p>
              <h3 className="font-bold text-gray-900">{recompensa.nombre}</h3>
              {recompensa.descripcionLarga && (
                <p className="text-sm leading-relaxed text-gray-600">{recompensa.descripcionLarga}</p>
              )}
              <p className="text-xs text-gray-500">Válido hasta {fmtFecha(recompensa.fechaExpiracion)}</p>

              {data.cuponPorReto?.estado === "desbloqueado_pendiente" ? (
                <button
                  onClick={onReclamar}
                  disabled={reclamando}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-welve-500 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  <Gift size={16} /> {reclamando ? "Reclamando..." : "¡Reclamar cupón!"}
                </button>
              ) : data.cuponPorReto ? (
                <Link
                  to="/wallet/mis-cupones"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-welve-600 shadow-sm transition-transform active:scale-[0.98]"
                >
                  <CheckCircle2 size={16} /> Ver mi cupón
                </Link>
              ) : null}

              {recompensa.terminosCondiciones && <TerminosAccordion terminos={recompensa.terminosCondiciones} />}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">¿Cómo completarlo?</p>
          <p className="text-sm text-gray-700">{descripcionCondicion(data.condicionTipo, data.meta, data.periodoDias)}</p>
          {data.empresaNombre && (
            <p className="mt-1 text-sm text-gray-500">{comoCompletarlo(data.condicionTipo, data.empresaNombre, data.periodoDias)}</p>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4">
          <Calendar size={16} className="mt-0.5 flex-shrink-0 text-welve-500" />
          <div className="text-sm text-gray-600">
            <p>Vigente hasta que se complete o expire el reto</p>
            {urgente && data.diasRestantes > 0 && (
              <p className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-600">
                <Clock size={12} /> Quedan {data.diasRestantes} día{data.diasRestantes === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
