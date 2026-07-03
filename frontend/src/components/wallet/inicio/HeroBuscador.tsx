import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Ticket, Store, Sparkles, Gift } from 'lucide-react';
import { useBusqueda } from '../../../hooks/useWallet';

interface Props {
  nombreCliente?: string;
  totalEmpresas: number;
  totalCupones: number;
  totalPuntos: number;
  search: string;
  onSearchChange: (v: string) => void;
  empresas: any[];
  cuponesDestacados: any[];
}

export default function HeroBuscador({
  nombreCliente, totalEmpresas, totalCupones, totalPuntos,
  search, onSearchChange, empresas, cuponesDestacados,
}: Props) {
  const navigate = useNavigate();
  const [focused, setFocused] = useState(false);
  const { empresas: empresasMatch, cupones: cuponesMatch } = useBusqueda(search, empresas, cuponesDestacados);
  const showDropdown = focused && search.trim() !== '';

  return (
    <div className="relative rounded-b-[40px] bg-welve-600 px-4 pt-8 pb-14 text-white shadow-lg sm:px-6">
      {/* Los íconos decorativos van en su propia capa recortada — el buscador
          de abajo necesita salirse del hero (-bottom-6) para flotar sobre el
          contenido siguiente, así que overflow-hidden no puede vivir en la
          raíz o se lo recorta a él también. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[40px]">
        <Gift size={140} strokeWidth={1.5} className="absolute -right-8 -top-8 rotate-12 text-white opacity-[0.08]" />
        <Sparkles size={64} strokeWidth={1.5} className="absolute right-16 top-24 text-white opacity-[0.08]" />
      </div>

      <h1 className="relative z-10 mb-2 text-2xl font-bold">¡Bienvenido{nombreCliente ? `, ${nombreCliente}` : ''}! 👋</h1>
      <p className="relative z-10 mb-6 text-sm text-welve-100">Descubre beneficios en tus lugares favoritos</p>

      <div className="relative z-10 flex flex-wrap gap-3">
        <div className="flex-shrink-0 rounded-2xl border border-white/10 bg-white/20 px-4 py-2 backdrop-blur-md">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-welve-100">Empresas</span>
          <span className="font-bold">{totalEmpresas}</span>
        </div>
        <div className="flex-shrink-0 rounded-2xl border border-white/10 bg-white/20 px-4 py-2 backdrop-blur-md">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-welve-100">Cupones listos</span>
          <span className="font-bold">{totalCupones}</span>
        </div>
        <div className="flex-shrink-0 rounded-2xl border border-white/10 bg-white/20 px-4 py-2 backdrop-blur-md">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-welve-100">Puntos</span>
          <span className="font-bold">{totalPuntos}</span>
        </div>
      </div>

      <div className="absolute -bottom-6 left-4 right-4 z-20 sm:left-6 sm:right-6">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-2 shadow-xl shadow-gray-200/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Busca cafeterías, cupones, beneficios..."
            className="flex-1 bg-transparent text-gray-800 outline-none placeholder:text-gray-400"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
          />
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full mt-2 max-h-80 divide-y divide-gray-50 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-xl">
            {empresasMatch.length === 0 && cuponesMatch.length === 0 && (
              <p className="p-4 text-center text-sm text-gray-400">Sin resultados para "{search}"</p>
            )}
            {empresasMatch.map((e: any) => (
              <button
                key={e.id}
                onMouseDown={() => navigate(`/wallet/empresa/${e.id}`)}
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50"
              >
                <Store size={16} className="flex-shrink-0 text-welve-500" />
                <span className="truncate text-sm font-medium text-gray-800">{e.nombre}</span>
              </button>
            ))}
            {cuponesMatch.map((c: any) => (
              <button
                key={c.id ?? c._id}
                onMouseDown={() => navigate(`/wallet/cupon/${c.id ?? c._id}`)}
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50"
              >
                <Ticket size={16} className="flex-shrink-0 text-welve-500" />
                <span className="truncate text-sm font-medium text-gray-800">{c.nombre}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
