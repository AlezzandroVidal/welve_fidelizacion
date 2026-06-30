import { useState } from 'react';
import { useMisCupones } from '../../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';

export default function MisCuponesPage() {
  const { data: agrupados, isLoading } = useMisCupones();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('todas');

  if (isLoading) {
    return <div className="p-6 text-center animate-pulse">Cargando cupones...</div>;
  }

  const entries = agrupados ? Object.entries(agrupados) : [];
  
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 bg-welve-100 rounded-full flex items-center justify-center mb-6">
          <Ticket size={40} className="text-welve-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Aún no tienes cupones</h2>
        <p className="text-gray-500 mb-8 max-w-[260px]">Visita tus lugares favoritos y completa retos para ganar beneficios exclusivos.</p>
        <button 
          onClick={() => navigate('/wallet')}
          className="bg-welve-600 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-welve-600/30 active:scale-95 transition-transform"
        >
          Explorar empresas
        </button>
      </div>
    );
  }

  const allCupones = entries.flatMap(([_id, data]: any) => 
    data.cupones.map((c: any) => ({ ...c, empresa: data.empresa }))
  );
  
  const displayCupones = activeTab === 'todas' 
    ? allCupones 
    : (entries.find(([id]: any) => id === activeTab) as any)?.[1]?.cupones?.map((c: any) => ({
        ...c, empresa: (entries.find(([id]: any) => id === activeTab) as any)?.[1]?.empresa
      })) || [];

  return (
    <div className="p-6 pb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis Cupones</h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 mb-2">
        <button
          onClick={() => setActiveTab('todas')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'todas' 
              ? 'bg-welve-600 text-white shadow-md' 
              : 'bg-white text-gray-600 border border-gray-100'
          }`}
        >
          Todas
        </button>
        {entries.map(([empresaId, data]: any) => (
          <button
            key={empresaId}
            onClick={() => setActiveTab(empresaId)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === empresaId
                ? 'bg-welve-600 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            {data.empresa.nombre}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {displayCupones.map((cupon: any) => (
          <div 
            key={cupon.id || cupon._id}
            onClick={() => navigate(`/wallet/empresa/${cupon.empresa.id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex h-28 relative cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className={`w-24 flex flex-col items-center justify-center border-r border-dashed border-gray-200 text-white relative ${
              cupon.tipo === 'porcentaje_descuento' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
              cupon.tipo === 'monto_descuento' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' :
              cupon.tipo === 'producto_gratis' ? 'bg-gradient-to-br from-orange-400 to-rose-500' :
              'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {/* Recortes ticket */}
              <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#EDEBFB]" />
              <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-[#EDEBFB]" />
              
              <span className="text-2xl font-black leading-none mb-1">
                {cupon.tipo === 'porcentaje_descuento' ? `${cupon.valor}%` :
                 cupon.tipo === 'monto_descuento' ? `S/${cupon.valor}` :
                 cupon.tipo === 'dos_por_uno' ? '2x1' : 'GRATIS'}
              </span>
              <span className="text-[9px] font-medium uppercase tracking-wider opacity-90">
                {cupon.tipo === 'porcentaje_descuento' ? 'OFF' :
                 cupon.tipo === 'monto_descuento' ? 'DSCTO' :
                 cupon.tipo === 'dos_por_uno' ? 'PROMO' : 'REGALO'}
              </span>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-center">
              {cupon.exclusivo && (
                <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md self-start mb-1 border border-yellow-100">
                  ⭐ EXCLUSIVO
                </span>
              )}
              <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
                {cupon.nombre}
              </h3>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <span className="font-semibold text-welve-600">{cupon.empresa.nombre}</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-auto">
                Expira: {new Date(cupon.fecha_expiracion).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
