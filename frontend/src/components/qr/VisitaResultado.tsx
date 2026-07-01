import { CheckCircle2, Flame, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ResultadoVisita } from "../../api/qr";

interface Props {
  resultado: ResultadoVisita;
  empresaNombre: string;
}

const CONFETTI_COLORS = ["#7C5CFC", "#3FD17A", "#FCE38A", "#FAC9DC", "#A892F0"];

function Confetti() {
  const pieces = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const duration = 1.4 + Math.random() * 1.2;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const size = 6 + Math.random() * 6;
        return (
          <span
            key={i}
            className="absolute top-0 rounded-sm opacity-90"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 1.6,
              backgroundColor: color,
              animation: `confetti-fall ${duration}s ease-in ${delay}s 1 both`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(420px) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function VisitaResultado({ resultado, empresaNombre }: Props) {
  const navigate = useNavigate();
  const {
    visitasTotales, rachaActual, recompensasDesbloqueadas,
    retosCompletados, subioAExclusivo, mensaje,
  } = resultado;
  const sinNovedades = !recompensasDesbloqueadas.length && !retosCompletados.length && !subioAExclusivo;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-welve-500 to-welve-700 px-6 py-10 text-center">
      <Confetti />

      <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-[28px] bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 size={44} className="text-green-500" />
        </div>

        <h1 className="mb-1 text-2xl font-black text-gray-900">¡Visita registrada! 🎉</h1>
        <p className="mb-6 text-sm text-gray-500">
          {visitasTotales} visitas totales en {empresaNombre}
        </p>

        {recompensasDesbloqueadas.map((r) => (
          <div key={r.cuponId} className="mb-3 animate-fade-up rounded-2xl border border-welve-200 bg-welve-50 p-4">
            <p className="text-sm font-bold text-welve-700">🎁 ¡Ganaste un beneficio!</p>
            <p className="mt-0.5 text-xs text-welve-600">{r.nombre}</p>
          </div>
        ))}

        {retosCompletados.map((r) => (
          <div key={r.retoId} className="mb-3 animate-fade-up rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-700">¡Completaste el reto {r.nombre}!</p>
            {r.recompensa && <p className="mt-0.5 text-xs text-amber-600">{r.recompensa}</p>}
          </div>
        ))}

        {subioAExclusivo && (
          <div className="mb-3 flex animate-fade-up items-center justify-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
            <Sparkles size={16} className="text-yellow-600" />
            <p className="text-sm font-bold text-yellow-700">⭐ ¡Ahora eres cliente VIP!</p>
          </div>
        )}

        {rachaActual > 0 && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-full bg-orange-50 px-4 py-2">
            <Flame size={16} className="text-orange-500" fill="currentColor" />
            <span className="text-sm font-bold text-orange-600">{rachaActual} de racha</span>
          </div>
        )}

        {sinNovedades && <p className="mb-6 text-sm text-gray-500">{mensaje}</p>}

        <div className="space-y-2">
          <button
            onClick={() => navigate("/wallet/mis-cupones")}
            className="w-full rounded-full bg-welve-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-welve-500/30 transition-transform active:scale-95"
          >
            Ver mis cupones
          </button>
          <button
            onClick={() => navigate("/wallet")}
            className="w-full rounded-full bg-gray-100 py-3.5 text-sm font-bold text-gray-700 transition-transform active:scale-95"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
