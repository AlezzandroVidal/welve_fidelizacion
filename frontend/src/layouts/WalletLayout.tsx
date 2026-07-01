import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Ticket, Clock, User, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMisCupones, usePerfil } from '../hooks/useWallet';
import Sidebar, { SIDEBAR_W, SIDEBAR_W_COLLAPSED, type SidebarNavGroup } from '../components/layout/Sidebar';

export default function WalletLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sideW = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;

  // El JWT del cliente no lleva nombre/email (ver core/security.py) — se piden al perfil real.
  const { data: perfilData } = usePerfil();
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

  const groups: SidebarNavGroup[] = [
    {
      label: 'Menú',
      items: tabs.map((t) => ({ to: t.path, icon: t.icon, label: t.name, badge: t.badge, end: t.path === '/wallet' })),
    },
  ];

  const isInteriorPage = location.pathname.includes('/wallet/empresa/');

  return (
    <div className="min-h-screen bg-welve-100 flex flex-col md:flex-row pb-20 md:pb-0">

      {/* Sidebar — mismo diseño que el panel de empresa */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        groups={groups}
        avatarNombre={perfilData?.cliente?.nombre}
        avatarSubtitulo={perfilData?.cliente?.email ?? user?.email}
        menuItems={[{ to: '/wallet/perfil', icon: User, label: 'Mi perfil' }]}
        onLogout={logout}
      />

      <main
        className="flex-1 flex flex-col min-h-screen transition-all duration-200 ease-out md:ml-[var(--sidebar-offset)]"
        style={{ ['--sidebar-offset' as string]: `${sideW + 24}px` }}
      >
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
                  <span className="text-sm font-medium text-gray-600">
                    Hola{perfilData?.cliente?.nombre ? `, ${perfilData.cliente.nombre.split(' ')[0]}` : ''}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-welve-100 flex items-center justify-center text-welve-600 font-bold text-sm">
                    {perfilData?.cliente?.nombre ? perfilData.cliente.nombre.charAt(0).toUpperCase() : 'W'}
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
