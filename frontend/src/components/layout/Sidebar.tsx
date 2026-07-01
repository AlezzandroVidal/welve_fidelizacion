import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { ChevronRight, LogOut, Menu, X } from "lucide-react";

export const SIDEBAR_W = 240;
export const SIDEBAR_W_COLLAPSED = 64;

export interface SidebarNavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  end?: boolean;
}

export interface SidebarNavGroup {
  label?: string;
  items: SidebarNavItem[];
}

export interface SidebarMenuItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

interface NavItemProps {
  item: SidebarNavItem;
  collapsed: boolean;
}

function NavItem({ item: { to, icon: Icon, label, badge, end }, collapsed }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center rounded-xl py-2.5 text-sm font-medium
         transition-colors duration-150 border-l-[3px]
         ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
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

interface AvatarMenuProps {
  nombre?: string;
  subtitulo?: string;
  imagenUrl?: string | null;
  collapsed: boolean;
  menuItems: SidebarMenuItem[];
  onLogout: () => void;
}

function AvatarCircle({ nombre, imagenUrl, size }: { nombre?: string; imagenUrl?: string | null; size: number }) {
  const initials = nombre?.trim()
    ? nombre.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "W";
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-welve-500/20"
      style={{ height: size, width: size }}
    >
      {imagenUrl ? (
        <img src={imagenUrl} alt={nombre ?? "Avatar"} className="h-full w-full object-cover object-center" />
      ) : (
        <span className="font-bold text-welve-300" style={{ fontSize: size * 0.4 }}>{initials}</span>
      )}
    </div>
  );
}

function AvatarMenu({ nombre, subtitulo, imagenUrl, collapsed, menuItems, onLogout }: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  function toggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ left: r.left, bottom: window.innerHeight - r.top + 8 });
    }
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onScrollOrResize() { setOpen(false); }
    document.addEventListener("mousedown", h);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      document.removeEventListener("mousedown", h);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open]);

  const nombreMostrado = nombre?.trim() || "Mi cuenta";

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className={`flex w-full items-center rounded-xl py-2.5 hover:bg-white/5 transition-colors
          ${collapsed ? "justify-center px-0" : "gap-3 px-3 text-left"}`}
      >
        <AvatarCircle nombre={nombre} imagenUrl={imagenUrl} size={32} />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-200">{nombreMostrado}</p>
            {subtitulo && <p className="truncate text-[10px] text-gray-500">{subtitulo}</p>}
          </div>
        )}
        {!collapsed && <ChevronRight size={14} className={`flex-shrink-0 text-gray-500 transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />}
      </button>

      {/* Se renderiza fuera del sidebar (portal) para no quedar recortado por
          las esquinas redondeadas (overflow-hidden) del panel flotante. */}
      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] w-60 rounded-2xl border border-white/10 bg-[#16132A] py-2 shadow-2xl shadow-black/40 animate-scale-in origin-bottom-left"
          style={{ left: pos.left, bottom: pos.bottom }}
        >
          <div className="flex flex-col items-center gap-2 px-4 pb-3 pt-1 border-b border-white/10">
            <AvatarCircle nombre={nombre} imagenUrl={imagenUrl} size={56} />
            <div className="text-center min-w-0 max-w-full">
              <p className="truncate text-sm font-semibold text-gray-100">{nombreMostrado}</p>
              {subtitulo && <p className="truncate text-[11px] text-gray-500">{subtitulo}</p>}
            </div>
          </div>
          <div className="py-1">
            {menuItems.map((item, i) => (
              <NavLink
                key={`${item.to}-${i}`}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors"
              >
                <item.icon size={14} /> {item.label}
              </NavLink>
            ))}
          </div>
          <div className="border-t border-white/10 pt-1">
            <button
              onClick={() => { setOpen(false); onLogout(); navigate("/login"); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
            >
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

interface SidebarContentProps {
  topBadge?: React.ReactNode;
  groups: SidebarNavGroup[];
  collapsed: boolean;
  onClose?: () => void;
  avatarNombre?: string;
  avatarSubtitulo?: string;
  avatarImagen?: string | null;
  menuItems: SidebarMenuItem[];
  onLogout: () => void;
}

function SidebarContent({
  topBadge, groups, collapsed, onClose,
  avatarNombre, avatarSubtitulo, avatarImagen, menuItems, onLogout,
}: SidebarContentProps) {
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

      {!collapsed && topBadge && <div className="px-4 pt-3">{topBadge}</div>}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 mt-2">
        {groups.map((group, i) => (
          <div key={i} className={i > 0 ? "border-t border-white/5 pt-4" : undefined}>
            {!collapsed && group.label && (
              <p className="mb-1.5 px-3 text-[9px] font-semibold uppercase tracking-widest text-gray-600">{group.label}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Avatar */}
      <div className="border-t border-white/10 p-3">
        <AvatarMenu
          nombre={avatarNombre}
          subtitulo={avatarSubtitulo}
          imagenUrl={avatarImagen}
          collapsed={collapsed}
          menuItems={menuItems}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
}

interface SidebarProps extends SidebarContentProps {
  collapsed: boolean;
  setCollapsed: (fn: (c: boolean) => boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

/**
 * Shell del sidebar: panel oscuro flotante con esquinas redondeadas, la flecha
 * de colapsar centrada verticalmente, y drawer para mobile. Compartido entre
 * el panel de empresa (AdminLayout) y el wallet del cliente (WalletLayout) —
 * mismo diseño en ambos módulos.
 */
export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, ...content }: SidebarProps) {
  const sideW = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;

  return (
    <>
      {/* Desktop sidebar — flotante con margen y esquinas redondeadas */}
      <aside
        className="hidden md:block fixed inset-y-3 left-3 z-30 overflow-visible rounded-3xl shadow-2xl shadow-black/20 transition-all duration-200 ease-out"
        style={{ width: sideW }}
      >
        <div className="h-full w-full overflow-hidden rounded-3xl">
          <SidebarContent collapsed={collapsed} {...content} />
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center
            rounded-full border border-white/10 bg-[#1E1B2E] text-gray-400 hover:text-white shadow-md
            transition-colors duration-150"
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          <Menu size={13} />
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-3 left-3 z-50 animate-slide-in-right overflow-hidden rounded-3xl shadow-2xl" style={{ width: SIDEBAR_W }}>
            <SidebarContent collapsed={false} onClose={() => setMobileOpen(false)} {...content} />
          </aside>
        </div>
      )}
    </>
  );
}
