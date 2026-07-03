import { useState } from 'react';
import CuponCardMini from '../CuponCardMini';

const CATEGORIAS = [
  { id: 'todos', label: 'Todos' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'postres', label: 'Comida' },
  { id: 'spa', label: 'Belleza' },
  { id: 'ropa', label: 'Ropa' },
];

/** Filtra sobre los cupones destacados ya cargados en el inicio (mismo dataset
 * que la búsqueda en vivo) — no agrega un endpoint de catálogo completo. */
export default function CuponesPorCategoria({ cupones }: { cupones: any[] }) {
  const [activa, setActiva] = useState('todos');
  if (cupones.length === 0) return null;

  const filtrados = activa === 'todos' ? cupones : cupones.filter((c: any) => (c.tags || []).includes(activa));

  return (
    <div className="mb-8">
      <h2 className="mb-4 px-1 text-lg font-bold text-gray-800">Cupones por categoría</h2>
      <div className="-mx-6 mb-4 flex gap-2 overflow-x-auto px-6 pb-1 scrollbar-hide">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiva(cat.id)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activa === cat.id
                ? 'bg-welve-600 text-white shadow-md'
                : 'border border-gray-100 bg-white text-gray-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      {filtrados.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No hay cupones en esta categoría por ahora</p>
      ) : (
        <div className="space-y-3">
          {filtrados.map((c: any) => (
            <CuponCardMini key={c.id ?? c._id} cupon={c} empresaNombre={c.empresa?.nombre} />
          ))}
        </div>
      )}
    </div>
  );
}
