import { useMemo, useState } from 'react';
import { Flame, Ticket } from 'lucide-react';
import CuponCard from '../CuponCard';
import CuponProgresoCard from '../CuponProgresoCard';

interface Props {
  cupones: any[];
  miRelacion: any;
  onVerQR: (cupon: any) => void;
}

export default function TabCupones({ cupones, miRelacion, onVerQR }: Props) {
  const [tagActivo, setTagActivo] = useState('todos');

  const tags = useMemo(() => {
    const set = new Set<string>();
    cupones.forEach((c: any) => (c.tags || []).forEach((t: string) => set.add(t)));
    return Array.from(set);
  }, [cupones]);

  const filtrados = tagActivo === 'todos' ? cupones : cupones.filter((c: any) => (c.tags || []).includes(tagActivo));
  const disponibles = filtrados.filter((c: any) => c.acceso ? c.acceso.puede_canjear : true);
  const enProgreso   = filtrados.filter((c: any) => c.acceso?.estado === 'en_progreso');

  return (
    <div>
      {miRelacion && (
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-welve-100 bg-gradient-to-br from-welve-50 to-welve-100 p-5 shadow-sm">
          {miRelacion.segmento === 'exclusivo' && (
            <div className="absolute top-0 right-0 rounded-bl-xl bg-yellow-400 px-4 py-1 text-[10px] font-bold text-yellow-900 shadow-sm">
              ⭐ Eres cliente VIP
            </div>
          )}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
              <Flame className="text-orange-500" size={24} fill="currentColor" />
            </div>
            <div>
              <h3 className="mb-1 font-bold leading-none text-gray-800">Tu racha</h3>
              <p className="text-sm text-gray-500">{miRelacion.racha_actual} semanas seguidas</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white bg-white/60 p-3">
              <p className="mb-0.5 text-[10px] font-bold uppercase text-gray-500">Visitas totales</p>
              <p className="text-lg font-black text-gray-900">{miRelacion.visitas_totales}</p>
            </div>
            <div className="rounded-xl border border-white bg-white/60 p-3">
              <p className="mb-0.5 text-[10px] font-bold uppercase text-gray-500">Puntos</p>
              <p className="text-lg font-black text-gray-900">{miRelacion.puntos}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-gray-900">Cupones</h2>
        <span className="rounded-full bg-welve-600 px-2 py-0.5 text-xs font-bold text-white">{cupones.length}</span>
      </div>

      {tags.length > 0 && (
        <div className="-mx-6 mb-4 flex gap-2 overflow-x-auto px-6 pb-1 scrollbar-hide">
          <button
            onClick={() => setTagActivo('todos')}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tagActivo === 'todos' ? 'bg-welve-600 text-white shadow-md' : 'border border-gray-100 bg-white text-gray-600'
            }`}
          >
            Todos
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTagActivo(t)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tagActivo === t ? 'bg-welve-600 text-white shadow-md' : 'border border-gray-100 bg-white text-gray-600'
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {disponibles.length > 0 && (
        <div className="mb-2">
          <h3 className="mb-2 px-1 text-sm font-bold text-gray-600">Disponibles para ti</h3>
          <div className="grid grid-cols-2 gap-3">
            {disponibles.map((cupon: any) => (
              <CuponCard key={cupon._id || cupon.id} cupon={cupon} onVerQR={onVerQR} />
            ))}
          </div>
        </div>
      )}

      {enProgreso.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 px-1 text-sm font-bold text-gray-600">Próximos beneficios</h3>
          <div className="grid grid-cols-2 gap-3">
            {enProgreso.map((cupon: any) => (
              <CuponProgresoCard key={cupon._id || cupon.id} cupon={cupon} />
            ))}
          </div>
        </div>
      )}

      {filtrados.length === 0 && (
        <div className="rounded-3xl border border-dashed border-gray-100 bg-white py-8 text-center">
          <Ticket className="mx-auto mb-2 text-gray-300" size={32} />
          <p className="text-sm font-medium text-gray-500">No hay cupones en esta categoría</p>
        </div>
      )}
    </div>
  );
}
