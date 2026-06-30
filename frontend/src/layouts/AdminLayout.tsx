import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Ticket, CheckSquare, Users,
  Target, Crown, Settings, LogOut, Menu, X,
  ChevronRight, User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEmpresaMe } from "../hooks/useEmpresa";
import { useCupones } from "../hooks/useCupones";
import { useClientes } from "../hooks/useClientes";

/* ── Nav groups ──────────────────────────────────────────────────────────── */

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

/* ── NavItem ─────────────────────────────────────────────────────────────── */

function NavItem({
  to, icon: Icon, label, collapsed, badge,
}: { to: string; icon: React.ElementType; label: string; collapsed: boolean; badge?: number }) {
  return (
    <NavLink
      to={to}
      end={to === "/admin/dashboard"}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
         transition-colors duration-150 border-l-[3px]
         ${isActive
           ? "border-welve-500 bg-welve-500/10 text-white"
           : "border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200"}`
      }
    >
      <Icon size={18} className="flex-shrink-0" />
      <span
        className="truncate transition-all duration-200"
        style={{ width: collapsed ? 0 : undefined, opacity: collapsed ? 0 : 1 }}
      >
        {label}
      </span>
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="ml-auto rounded-full bg-welve-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-welve-300 tabular">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </NavLink>
  );
}

/* ── Avatar dropdown ─────────────────────────────────────────────────────── */

function AvatarMenu({ email, nombre, logoUrl, collapsed }: {
  email?: string; nombre?: string; logoUrl?: string | null; collapsed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref    = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const navigate   = useNavigate();

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const initials = nombre
    ? nombre.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left
          hover:bg-white/5 transition-colors"
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full overflow-hidden bg-welve-500/20">
          {logoUrl ? (
            <img src={logoUrl} alt={nombre} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-welve-300">{initials}</span>
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-200">{nombre ?? "—"}</p>
            <p className="truncate text-[10px] text-gray-500">{email}</p>
          </div>
        )}
        {!collapsed && <ChevronRight size={14} className={`flex-shrink-0 text-gray-500 transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border border-white/10 bg-[#16132A] py-1.5 shadow-xl animate-scale-in origin-bottom-left z-50">
          <div className="px-4 py-2 border-b border-white/10">
            <p className="text-xs font-semibold text-gray-200 truncate">{nombre}</p>
            <p className="text-[10px] text-gray-500 truncate">{email}</p>
          </div>
          <NavLink
            to="/admin/config"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors"
          >
            <User size={14} /> Mi perfil
          </NavLink>
          <NavLink
            to="/admin/config"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors"
          >
            <Settings size={14} /> Configuración
          </NavLink>
          <div className="border-t border-white/10 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); logout(); navigate("/login"); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
            >
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sidebar content ─────────────────────────────────────────────────────── */

function SidebarContent({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const { user }           = useAuth();
  const { data: empresa }  = useEmpresaMe();
  const { data: cupones }  = useCupones();
  const { data: clientes } = useClientes();

  const plan       = empresa?.planSuscripcion ?? "";
  const cuponesActivos = cupones?.filter((c) => c.estado === "activo").length ?? 0;

  return (
    <div className="flex h-full flex-col bg-[#1E1B2E]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-welve-500">
          <span className="text-sm font-black text-white">W</span>
        </div>
        {!collapsed && (
          <span
            className="text-base font-black"
            style={{ background: "linear-gradient(135deg, #7C5CFC, #5B3FD4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            Welve
          </span>
        )}
        {onClose && (
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Plan chip */}
      {!collapsed && plan && (
        <div className="px-4 pt-3">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${PLAN_COLOR[plan] ?? "bg-gray-700 text-gray-300"}`}>
            Plan {PLAN_LABEL[plan] ?? plan}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 mt-2">
        {/* Principal */}
        <div>
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[9px] font-semibold uppercase tracking-widest text-gray-600">Principal</p>
          )}
          <div className="space-y-0.5">
            <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
            <NavItem to="/admin/cupones"   icon={Ticket}          label="Cupones"   collapsed={collapsed} badge={cuponesActivos} />
            <NavItem to="/admin/canjes"    icon={CheckSquare}     label="Canjes"    collapsed={collapsed} />
            <NavItem to="/admin/clientes"  icon={Users}           label="Clientes"  collapsed={collapsed} badge={clientes?.length} />
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-white/5 pt-4">
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[9px] font-semibold uppercase tracking-widest text-gray-600">Programa</p>
          )}
          <div className="space-y-0.5">
            <NavItem to="/admin/retos"     icon={Target} label="Retos"     collapsed={collapsed} />
            <NavItem to="/admin/membresias" icon={Crown} label="Membresías" collapsed={collapsed} />
          </div>
        </div>

        {/* Sistema */}
        <div className="border-t border-white/5 pt-4">
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[9px] font-semibold uppercase tracking-widest text-gray-600">Sistema</p>
          )}
          <NavItem to="/admin/config" icon={Settings} label="Configuración" collapsed={collapsed} />
        </div>
      </nav>

      {/* Avatar */}
      <div className="border-t border-white/10 p-3">
        <AvatarMenu
          email={user?.email}
          nombre={empresa?.nombre}
          logoUrl={empresa?.logoUrl}
          collapsed={collapsed}
        />
      </div>
    </div>
  );
}

/* ── Layout ──────────────────────────────────────────────────────────────── */

const SIDEBAR_W           = 240;
const SIDEBAR_W_COLLAPSED = 64;

export default function AdminLayout() {
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const sideW = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;

  return (
    <div className="flex min-h-screen bg-welve-100">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:block fixed inset-y-0 z-30 transition-all duration-200 ease-out"
        style={{ width: sideW }}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center
            rounded-full border border-white/10 bg-[#1E1B2E] text-gray-400 hover:text-white shadow-md
            transition-colors duration-150"
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          <Menu size={12} />
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 z-50 animate-slide-in-right" style={{ width: SIDEBAR_W }}>
            <SidebarContent collapsed={false} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-200 ease-out"
        style={{ marginLeft: sideW }}
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
