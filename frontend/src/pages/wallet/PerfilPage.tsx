import { usePerfil } from '../../hooks/useWallet';
import { useAuth } from '../../context/AuthContext';
import { Flame, Ticket, Store, Award, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PerfilPage() {
  const { data, isLoading } = usePerfil();
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading || !data) {
    return <div className="p-6 text-center animate-pulse">Cargando perfil...</div>;
  }

  const { cliente, resumen, total_canjes, total_empresas, total_puntos_global, racha_maxima_global } = data;

  const handleLogout = () => {
    if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
      logout();
    }
  };

  return (
    <div className="pb-10">
      {/* HEADER */}
      <div className="bg-white pt-10 pb-8 px-6 rounded-b-[40px] shadow-sm flex flex-col items-center border-b border-gray-100 relative">
        <div className="w-24 h-24 bg-gradient-to-br from-welve-400 to-welve-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-welve-500/30 border-4 border-white mb-4">
          {cliente.nombre.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-xl font-bold text-gray-900 text-center">{cliente.nombre}</h1>
        <p className="text-gray-500 text-sm mt-1">{cliente.email}</p>
        {cliente.whatsapp && <p className="text-gray-500 text-sm mt-1">{cliente.whatsapp}</p>}
        
        {/* Boton Editar (solo UI por ahora) */}
        <button className="mt-4 text-xs font-semibold text-welve-600 bg-welve-50 px-4 py-1.5 rounded-full hover:bg-welve-100 transition-colors">
          Editar perfil
        </button>
      </div>

      <div className="px-6 mt-6">
        {/* STATS */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <Ticket size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Canjes</p>
              <p className="text-lg font-black text-gray-800">{total_canjes}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <Store size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Lugares</p>
              <p className="text-lg font-black text-gray-800">{total_empresas}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
              <Award size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Puntos</p>
              <p className="text-lg font-black text-gray-800">{total_puntos_global}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <Flame size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Racha Max</p>
              <p className="text-lg font-black text-gray-800">{racha_maxima_global}</p>
            </div>
          </div>
        </div>

        {/* MIS EMPRESAS */}
        <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Mis Relaciones</h2>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {resumen.length > 0 ? resumen.map((res: any, idx: number) => (
            <div 
              key={res.empresa.id}
              onClick={() => navigate(`/wallet/empresa/${res.empresa.id}`)}
              className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${idx !== resumen.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                {res.empresa.logo_url ? (
                  <img src={res.empresa.logo_url} alt="logo" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                    {res.empresa.nombre.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm text-gray-800">{res.empresa.nombre}</h3>
                  <p className="text-xs text-gray-500">{res.visitas} visitas • {res.puntos} pts</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {res.segmento === 'exclusivo' && (
                  <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">VIP</span>
                )}
                {res.racha > 0 && (
                  <div className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                    <Flame size={12} fill="currentColor" /> {res.racha}
                  </div>
                )}
                <ChevronRight size={16} className="text-gray-300 ml-1" />
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-500 text-sm">
              Aún no tienes relación con ninguna empresa.
            </div>
          )}
        </div>

        {/* LOGOUT */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-rose-500 font-bold py-4 rounded-2xl hover:bg-rose-50 transition-colors"
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
