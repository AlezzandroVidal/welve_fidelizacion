import { useState } from "react";
import { Outlet } from "react-router-dom";
import {
  LayoutDashboard, Ticket, CheckSquare, Users,
  Target, Crown, Settings, Menu, User, QrCode, ScanLine, Star, CreditCard,
  ShoppingCart, Receipt, Package, Warehouse,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEmpresaMe } from "../hooks/useEmpresa";
import { useCupones } from "../hooks/useCupones";
import { useClientes } from "../hooks/useClientes";
import { useAlertasStock } from "../hooks/useProductos";
import Sidebar, { SIDEBAR_W, SIDEBAR_W_COLLAPSED, type SidebarNavGroup } from "../components/layout/Sidebar";

const PLAN_LABEL: Record<string, string> = {
  starter:      "Starter",
  growth:       "Growth",
  pro:          "Pro",
  basico:       "Básico",
  profesional:  "Profesional",
  enterprise:   "Enterprise",
};

const PLAN_COLOR: Record<string, string> = {
  starter:     "bg-gray-700 text-gray-300",
  growth:      "bg-welve-800 text-welve-200",
  pro:         "bg-amber-800/60 text-amber-300",
  basico:      "bg-gray-700 text-gray-300",
  profesional: "bg-welve-800 text-welve-200",
  enterprise:  "bg-amber-800/60 text-amber-300",
};

export default function AdminLayout() {
  const { logout } = useAuth();
  const { data: empresa } = useEmpresaMe();
  const { data: cupones } = useCupones();
  const { data: clientes } = useClientes();
  const { data: alertasStock } = useAlertasStock();

  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sideW = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;

  const plan = empresa?.planSuscripcion ?? "";
  const cuponesActivos = cupones?.filter((c) => c.estado === "activo").length ?? 0;

  const groups: SidebarNavGroup[] = [
    {
      label: "Principal",
      items: [
        { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
        { to: "/admin/staff",     icon: ScanLine,        label: "Registrar" },
        { to: "/admin/clientes",  icon: Users,           label: "Clientes", badge: clientes?.length },
        { to: "/admin/qr",        icon: QrCode,          label: "Mis QR Codes" },
      ],
    },
    {
      label: "Ventas",
      items: [
        { to: "/admin/caja",       icon: ShoppingCart, label: "Caja" },
        { to: "/admin/ventas",     icon: Receipt,       label: "Ventas" },
        { to: "/admin/productos",  icon: Package,       label: "Productos" },
        { to: "/admin/inventario", icon: Warehouse,     label: "Inventario", badge: alertasStock?.length },
        { to: "/admin/cupones",    icon: Ticket,        label: "Cupones", badge: cuponesActivos },
        { to: "/admin/canjes",     icon: CheckSquare,   label: "Canjes" },
      ],
    },
    {
      label: "Programa",
      items: [
        { to: "/admin/retos",      icon: Target, label: "Retos" },
        { to: "/admin/membresias", icon: Crown,  label: "Membresías" },
        { to: "/admin/resenas",    icon: Star,   label: "Reseñas" },
      ],
    },
    {
      label: "Sistema",
      items: [
        { to: "/admin/pagos",  icon: CreditCard, label: "Suscripción" },
        { to: "/admin/config", icon: Settings,   label: "Configuración" },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-welve-100">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        topBadge={
          plan ? (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${PLAN_COLOR[plan] ?? "bg-gray-700 text-gray-300"}`}>
              Plan {PLAN_LABEL[plan] ?? plan}
            </span>
          ) : undefined
        }
        groups={groups}
        avatarNombre={empresa?.nombre}
        avatarSubtitulo={empresa?.adminEmail}
        avatarImagen={empresa?.logoUrl}
        menuItems={[
          { to: "/admin/config", icon: User,     label: "Mi perfil" },
          { to: "/admin/config", icon: Settings, label: "Configuración" },
        ]}
        onLogout={logout}
      />

      {/* Content */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-200 ease-out md:ml-[var(--sidebar-offset)]"
        style={{ ['--sidebar-offset' as string]: `${sideW + 24}px` }}
      >
        {/* Mobile topbar */}
        <div className="flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 md:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-gray-500 hover:text-gray-800 transition-colors">
            <Menu size={20} />
          </button>
          <span className="font-black text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #7C5CFC, #5B3FD4)" }}>
            Welve
          </span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
