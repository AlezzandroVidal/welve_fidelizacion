import { useEffect, useState } from "react";
import { CheckCircle2, Gift, Lock } from "lucide-react";

export interface RetoCardData {
  id: string;
  nombre: string;
  condicionTipo: string;
  progresoActual: number;
  meta: number;
  porcentaje: number;
  completado: boolean;
  cuponRecompensaNombre: string | null;
  diasRestantes: number;
  /** Cupón visibilidad=por_reto ligado a este reto (distinto de
   * cuponRecompensaNombre, que es el mecanismo clásico de auto-canje) — si
   * existe, reemplaza el badge pasivo por un botón de reclamo o un estado
   * de "ya enviado". */
  cuponPorReto?: { nombre: string; estado: string } | null;
}

function descripcion(reto: RetoCardData): string {
  if (reto.condicionTipo === "num_visitas") return `Visita ${reto.meta} veces y gana tu recompensa`;
  return `Acumula S/ ${reto.meta} en compras y gana tu recompensa`;
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
}

export default function RetoCard({ reto, onReclamar, reclamando }: Props) {
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAncho(Math.min(reto.porcentaje, 100)), 80);
    return () => clearTimeout(t);
  }, [reto.porcentaje]);

  const urgente = reto.diasRestantes <= 3 && !reto.completado;

  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-sm ${reto.completado ? "border-green-200" : "border-gray-100"}`}>
      {reto.completado && <ConfettiCSS />}

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="mb-1 font-bold text-gray-900">{reto.nombre}</h3>
          <p className="text-xs text-gray-500">{descripcion(reto)}</p>
        </div>
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

      {reto.cuponPorReto?.estado === "desbloqueado_pendiente" && (
        <button
          onClick={onReclamar}
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

      {!reto.cuponPorReto && reto.cuponRecompensaNombre && (
        <div className="flex items-center gap-2 rounded-xl bg-welve-50 px-3 py-2 text-xs font-semibold text-welve-700">
          {reto.completado ? <Gift size={14} /> : <Lock size={14} />}
          Ganarás: {reto.cuponRecompensaNombre}
        </div>
      )}
    </div>
  );
}
