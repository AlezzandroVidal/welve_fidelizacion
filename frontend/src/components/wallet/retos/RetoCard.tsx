import { useEffect, useState } from "react";
import { CheckCircle2, Gift, Lock, Target, ChevronRight } from "lucide-react";
import { descripcionCondicion, comoCompletarlo } from "../../../utils/retos";
import type { CuponResumen } from "../../../api/wallet";

export interface RetoCardData {
  id: string;
  nombre: string;
  condicionTipo: string;
  periodoDias?: number | null;
  progresoActual: number;
  meta: number;
  porcentaje: number;
  completado: boolean;
  cuponRecompensaNombre: string | null;
  cuponRecompensa?: CuponResumen | null;
  diasRestantes: number;
  empresaNombre?: string;
  /** Cupón visibilidad=por_reto ligado a este reto (distinto de
   * cuponRecompensaNombre, que es el mecanismo clásico de auto-canje) — si
   * existe, reemplaza el badge pasivo por un botón de reclamo o un estado
   * de "ya enviado". */
  cuponPorReto?: { nombre: string; estado: string } | null;
}

const COLORES_CONFETTI = ["#7C5CFC", "#3FD17A", "#FCE38A", "#FAC9DC", "#A892F0"];

function ConfettiCSS() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className="absolute top-0 h-2 w-2 animate-confetti rounded-sm"
          style={{ left: `${(i * 10) % 100}%`, background: COLORES_CONFETTI[i % COLORES_CONFETTI.length], animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

interface Props {
  reto: RetoCardData;
  onReclamar?: () => void;
  reclamando?: boolean;
  onVerDetalle?: () => void;
}

export default function RetoCard({ reto, onReclamar, reclamando, onVerDetalle }: Props) {
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAncho(Math.min(reto.porcentaje, 100)), 80);
    return () => clearTimeout(t);
  }, [reto.porcentaje]);

  const urgente = reto.diasRestantes <= 3 && !reto.completado;
  const faltan = Math.max(0, reto.meta - reto.progresoActual);
  const recompensa = reto.cuponRecompensa;

  return (
    <div
      onClick={onVerDetalle}
      className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-sm transition-shadow ${onVerDetalle ? "cursor-pointer hover:shadow-md" : ""} ${reto.completado ? "border-green-200" : "border-gray-100"}`}
    >
      {reto.completado && <ConfettiCSS />}

      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-welve-50">
          <Target size={20} className="text-welve-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900">{reto.nombre}</h3>
            {reto.completado ? (
              <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">
                <CheckCircle2 size={12} /> ¡Completado!
              </span>
            ) : (
              <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${urgente ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>
                {reto.diasRestantes}d restantes
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{descripcionCondicion(reto.condicionTipo, reto.meta, reto.periodoDias)}</p>
        </div>
      </div>

      <div className="relative mb-1.5 h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`flex h-full items-center justify-center rounded-full text-[9px] font-bold text-white transition-all duration-1000 ease-out ${reto.completado ? "bg-green-500" : "bg-welve-500"}`}
          style={{ width: `${ancho}%` }}
        >
          {ancho > 15 && `${Math.round(reto.porcentaje)}%`}
        </div>
      </div>
      <div className="mb-3 flex justify-between text-[10px] font-bold text-gray-400">
        <span>{reto.progresoActual} / {reto.meta}</span>
        <span>{Math.round(reto.porcentaje)}%</span>
      </div>

      {recompensa && (
        <div className="mb-3 flex w-full items-center gap-3 rounded-2xl bg-welve-50 p-3 text-left">
          {recompensa.imagenUrl ? (
            <img src={recompensa.imagenUrl} alt="" className="h-11 w-11 flex-shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-welve-100">
              <Gift size={18} className="text-welve-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-gray-800">{recompensa.nombre}</p>
            <p className="text-[10px] text-gray-500">Cupón • Ver detalles del cupón</p>
          </div>
          <ChevronRight size={16} className="flex-shrink-0 text-welve-400" />
        </div>
      )}

      {reto.empresaNombre && (
        <p className="mb-3 text-[11px] text-gray-400">
          <span className="font-semibold text-gray-500">¿Cómo completarlo? </span>
          {comoCompletarlo(reto.condicionTipo, reto.empresaNombre, reto.periodoDias)}
        </p>
      )}

      {reto.cuponPorReto?.estado === "desbloqueado_pendiente" && (
        <button
          onClick={(e) => { e.stopPropagation(); onReclamar?.(); }}
          disabled={reclamando}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-welve-500 px-3 py-2.5 text-xs font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          <Gift size={14} /> {reclamando ? "Reclamando..." : "¡Reclamar mi cupón!"}
        </button>
      )}

      {reto.cuponPorReto && reto.cuponPorReto.estado !== "desbloqueado_pendiente" && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
          <CheckCircle2 size={14} /> ¡Cupón enviado a tu cuponera!
        </div>
      )}

      {!reto.cuponPorReto && !recompensa && reto.cuponRecompensaNombre && (
        <div className="flex items-center gap-2 rounded-xl bg-welve-50 px-3 py-2 text-xs font-semibold text-welve-700">
          {reto.completado ? <Gift size={14} /> : <Lock size={14} />}
          Ganarás: {reto.cuponRecompensaNombre}
        </div>
      )}

      {!reto.completado && !reto.cuponPorReto && (
        <p className="mt-2 text-center text-[10px] font-semibold text-gray-400">
          Te falta{faltan === 1 ? "" : "n"} {faltan} para completarlo
        </p>
      )}
    </div>
  );
}
