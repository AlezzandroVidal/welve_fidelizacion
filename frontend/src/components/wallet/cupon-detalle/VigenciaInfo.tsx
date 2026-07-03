import { Calendar } from 'lucide-react';
import type { CuponDetalle } from '../../../api/wallet';

function fmt(d: string) {
  return new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function VigenciaInfo({ cupon }: { cupon: CuponDetalle }) {
  const diasParaVencer = Math.ceil(
    (new Date(cupon.fechaExpiracion).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const porcentajeUso = cupon.limiteUsosTotal
    ? Math.min((cupon.usosActuales / cupon.limiteUsosTotal) * 100, 100)
    : null;

  return (
    <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Calendar size={18} className="mt-0.5 shrink-0 text-welve-500" />
        <div className="text-sm text-gray-600">
          <p>Desde {fmt(cupon.fechaInicio)}</p>
          <p>Hasta {fmt(cupon.fechaExpiracion)}</p>
        </div>
      </div>

      {cupon.estaVigente && diasParaVencer <= 7 && diasParaVencer >= 0 && (
        <p className="text-xs font-bold text-amber-600">
          ⏰ Vence en {diasParaVencer} día{diasParaVencer === 1 ? '' : 's'}
        </p>
      )}

      {porcentajeUso !== null && (
        <div>
          <div className="mb-1 flex justify-between text-[10px] font-bold text-gray-400">
            <span>Usos</span>
            <span>{cupon.usosActuales} / {cupon.limiteUsosTotal}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-welve-500" style={{ width: `${porcentajeUso}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
