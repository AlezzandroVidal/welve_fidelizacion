import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Ticket, Clock, User, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMisCupones } from '../hooks/useWallet';

export default function WalletLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: misCuponesData } = useMisCupones();
  const totalCupones = misCuponesData 
    ? Object.values(misCuponesData).reduce((acc: number, curr: any) => acc + curr.cupones.length, 0)
    : 0;

  const tabs = [
    { name: 'Inicio', path: '/wallet', icon: Home },
    { name: 'Mis Cupones', path: '/wallet/mis-cupones', icon: Ticket, badge: totalCupones },
    { name: 'Historial', path: '/wallet/historial', icon: Clock },
    { name: 'Perfil', path: '/wallet/perfil', icon: User },
  ];

  const isInteriorPage = location.pathname.includes('/wallet/empresa/');

  return (
    <div className="min-h-screen bg-[#EDEBFB] flex flex-col md:flex-row pb-20 md:pb-0">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 fixed h-full z-10">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-welve-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">W</span>
          </div>
          <span className="text-xl font-bold text-gray-800">Welve</span>
        </div>

        <div className="flex items-center gap-3 mb-8 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-welve-100 flex items-center justify-center text-welve-600 font-bold">
            {(user as any)?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">{(user as any)?.nombre}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-welve-50 text-welve-600 font-semibold shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-welve-600' : ''} />
                <span>{tab.name}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-auto bg-welve-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* MOBILE TOP BAR */}
        <header className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm">
          <div className="px-4 h-14 flex items-center justify-between">
            {isInteriorPage ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate(-1)}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100"
                >
                  <ChevronLeft size={24} />
                </button>
                <span className="font-semibold text-gray-800">Detalle</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-welve-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">W</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Hola, {(user as any)?.nombre?.split(' ')[0]}</span>
                  <div className="w-8 h-8 rounded-full bg-welve-100 flex items-center justify-center text-welve-600 font-bold text-sm">
                    {(user as any)?.nombre?.charAt(0).toUpperCase()}
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 max-w-5xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <ul className="flex justify-between items-center">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || (tab.path === '/wallet' && location.pathname === '/wallet/');
            const Icon = tab.icon;
            
            return (
              <li key={tab.path}>
                <Link
                  to={tab.path}
                  className="relative flex flex-col items-center justify-center w-16"
                >
                  <div className={`flex flex-col items-center justify-center w-full transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                    <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-welve-100 text-welve-600' : 'text-gray-400'}`}>
                      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={`text-[10px] mt-1 font-medium transition-colors ${isActive ? 'text-welve-600' : 'text-gray-400'}`}>
                      {tab.name}
                    </span>
                  </div>
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute top-0 right-2 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white">
                      {tab.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
