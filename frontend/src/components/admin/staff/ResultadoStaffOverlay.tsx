import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import type { ResultadoVisita } from "../../../api/qr";

interface Props {
  clienteNombre: string;
  resultado: ResultadoVisita;
  onDone: () => void;
}

/** Pantalla completa de confirmación tras registrar visita o canje — se cierra sola a los 3s. */
export default function ResultadoStaffOverlay({ clienteNombre, resultado, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  const { visitasTotales, rachaActual, recompensasDesbloqueadas } = resultado;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#3FD17A] px-6 text-center text-white">
      <CheckCircle2 size={64} className="mb-4" />
      <h1 className="mb-1 text-2xl font-black">{clienteNombre}</h1>
      <p className="mb-6 text-lg font-bold">✓ Visita registrada</p>
      <p className="mb-6 text-sm font-semibold opacity-90">
        {visitasTotales} visitas totales · Racha: {rachaActual}
      </p>

      {recompensasDesbloqueadas.map((r) => (
        <div key={r.cuponId} className="mb-3 w-full max-w-xs rounded-2xl bg-yellow-300 px-4 py-3 text-yellow-900">
          <p className="text-sm font-black">🎁 GANÓ: {r.nombre}</p>
        </div>
      ))}
    </div>
  );
}
