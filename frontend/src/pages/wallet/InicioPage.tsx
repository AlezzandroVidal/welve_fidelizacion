import { useState } from 'react';
import { Search, Coffee, Sparkles, ShoppingBag, UtensilsCrossed, MoreHorizontal, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEmpresasWallet, usePerfil } from '../../hooks/useWallet';

const CATEGORIAS = [
  { id: 'todos', label: 'Todos', icon: Search }, // Or another icon
  { id: 'food_beverage', label: 'Cafeterías', icon: Coffee },
  { id: 'belleza', label: 'Belleza', icon: Sparkles },
  { id: 'retail', label: 'Retail', icon: ShoppingBag },
  { id: 'restaurantes', label: 'Restaurantes', icon: UtensilsCrossed },
  { id: 'otros', label: 'Otros', icon: MoreHorizontal },
];

export default function InicioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('todos');

  const { data: empresasData, isLoading } = useEmpresasWallet();
  const { data: perfilData } = usePerfil();

  const empresas = empresasData || [];
  
  // Filter
  const empresasFiltradas = empresas.filter((emp: any) => {
    const matchSearch = emp.nombre.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = categoriaActiva === 'todos' || emp.rubro === categoriaActiva;
    return matchSearch && matchCategoria;
  });

  const empresasFavoritas = empresas.filter((e: any) => e.mi_relacion);

  const getGradientForRubro = (rubro: string) => {
    switch (rubro) {
      case 'food_beverage': return 'bg-gradient-to-br from-orange-400 to-yellow-400';
      case 'belleza': return 'bg-gradient-to-br from-pink-400 to-purple-500';
      case 'retail': return 'bg-gradient-to-br from-blue-400 to-emerald-400';
      default: return 'bg-gradient-to-br from-gray-400 to-slate-600';
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center animate-pulse">Cargando...</div>;
  }

  return (
    <div className="pb-8">
      {/* HERO */}
      <div className="bg-welve-600 text-white px-6 pt-8 pb-14 rounded-b-[40px] shadow-lg relative">
        <h1 className="text-2xl font-bold mb-2">¡Bienvenido, {(user as any)?.nombre?.split(' ')[0]}! 👋</h1>
        <p className="text-welve-100 text-sm mb-6">Descubre beneficios en tus lugares favoritos</p>
        
        {/* CHIPS RESUMEN */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
          <div className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 flex-shrink-0 border border-white/10">
            <span className="block text-[10px] text-welve-100 uppercase tracking-wide font-semibold">Empresas</span>
            <span className="font-bold">{perfilData?.total_empresas || 0}</span>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 flex-shrink-0 border border-white/10">
            <span className="block text-[10px] text-welve-100 uppercase tracking-wide font-semibold">Cupones listos</span>
            <span className="font-bold">
              {empresas.reduce((acc: any, emp: any) => acc + (emp.total_cupones_activos || 0), 0)}
            </span>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 flex-shrink-0 border border-white/10">
            <span className="block text-[10px] text-welve-100 uppercase tracking-wide font-semibold">Puntos</span>
            <span className="font-bold">{perfilData?.total_puntos_global || 0}</span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="absolute -bottom-6 left-6 right-6">
          <div className="bg-white rounded-2xl p-2 shadow-xl shadow-gray-200/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Buscar empresas..."
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-12 px-6">
        {/* FILTROS */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 mt-4">
          {CATEGORIAS.map(cat => {
            const Icon = cat.icon;
            const isActive = categoriaActiva === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 transition-all ${
                  isActive 
                    ? 'bg-welve-600 text-white shadow-md shadow-welve-600/30' 
                    : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* FAVORITAS */}
        {empresasFavoritas.length > 0 && search === '' && categoriaActiva === 'todos' && (
          <div className="mt-6 mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Tus lugares favoritos</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
              {empresasFavoritas.map((emp: any) => (
                <div 
                  key={emp.id} 
                  onClick={() => navigate(`/wallet/empresa/${emp.id}`)}
                  className="bg-white rounded-2xl p-4 min-w-[160px] shadow-sm border border-gray-100 flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between mb-3">
                    {emp.logo_url ? (
                      <img src={emp.logo_url} alt={emp.nombre} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getGradientForRubro(emp.rubro)}`}>
                        {emp.nombre.charAt(0)}
                      </div>
                    )}
                    {emp.mi_relacion?.racha_actual > 0 && (
                      <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded-full text-xs font-bold">
                        <Flame size={12} fill="currentColor" />
                        {emp.mi_relacion.racha_actual}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 truncate">{emp.nombre}</h3>
                  <p className="text-xs text-gray-500 mt-1">{emp.total_cupones_activos} beneficios</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPLORAR */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Descubre nuevas empresas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {empresasFiltradas.map((emp: any) => (
              <div 
                key={emp.id} 
                onClick={() => navigate(`/wallet/empresa/${emp.id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-welve-900/5 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className={`h-28 relative ${!emp.logo_url && getGradientForRubro(emp.rubro)}`}>
                  {emp.logo_url && (
                    <img src={emp.logo_url} className="w-full h-full object-cover" alt="portada" />
                  )}
                  {/* Badge categoria */}
                  <div className="absolute top-2 left-2 bg-black/30 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-lg">
                    {CATEGORIAS.find(c => c.id === emp.rubro)?.label || 'Otro'}
                  </div>
                  {/* Exclusivo badge */}
                  {emp.mi_relacion?.segmento === 'exclusivo' && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                      ⭐ VIP
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight line-clamp-1">{emp.nombre}</h3>
                  <p className="text-[11px] text-gray-500 line-clamp-2 mb-3 flex-1">
                    {emp.descripcion || 'Sin descripción disponible para esta empresa.'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-medium pt-2 border-t border-gray-50 mt-auto">
                    <span className="text-welve-600 bg-welve-50 px-2 py-1 rounded-md">
                      {emp.total_cupones_activos} cupones
                    </span>
                    {emp.mi_relacion && (
                      <span className="text-gray-500">
                        {emp.mi_relacion.visitas_totales} visitas
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {empresasFiltradas.length === 0 && (
              <div className="col-span-2 md:col-span-3 text-center py-10">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-500 font-medium">No se encontraron empresas</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
