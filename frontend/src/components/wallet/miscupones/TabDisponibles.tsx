import { Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CuponCard from '../CuponCard';

interface Props {
  agrupados: Record<string, { empresa: any; cupones: any[] }>;
  onVerQR: (cupon: any) => void;
}

export default function TabDisponibles({ agrupados, onVerQR }: Props) {
  const navigate = useNavigate();
  const entries = Object.entries(agrupados);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-welve-100">
          <Ticket size={40} className="text-welve-500" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">Aún no tienes cupones</h2>
        <p className="mb-8 max-w-[260px] text-gray-500">
          Visita tus lugares favoritos y completa retos para ganar beneficios exclusivos.
        </p>
        <button
          onClick={() => navigate('/wallet')}
          className="rounded-full bg-welve-600 px-8 py-3 font-bold text-white shadow-lg shadow-welve-600/30 transition-transform active:scale-95"
        >
          Explorar empresas
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {entries.map(([empresaId, data]) => (
        <div key={empresaId}>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-gray-900">{data.empresa.nombre}</h2>
            <span className="rounded-full bg-welve-50 px-2 py-0.5 text-xs font-bold text-welve-600">
              {data.cupones.length} disponible{data.cupones.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.cupones.map((c: any) => (
              <CuponCard key={c.id ?? c._id} cupon={c} onVerQR={onVerQR} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
