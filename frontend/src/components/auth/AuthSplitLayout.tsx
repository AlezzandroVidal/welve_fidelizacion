import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import logoWelveFull from "../../resources/logo_welve.svg";
import logoWelveIcon from "../../resources/logo_welve_icon.png";
import decoracionPersonas from "../../resources/vec1.svg";

export interface AuthBenefit {
  icon: LucideIcon;
  label: string;
}

interface AuthSplitLayoutProps {
  tagline: string;
  benefits: AuthBenefit[];
  children: ReactNode;
}

/**
 * Shell de 2 columnas para Login/Register: branding a la izquierda (oculto en
 * mobile, DESIGN.md §4), formulario a la derecha. El children ya trae su
 * propia tarjeta blanca — este componente solo resuelve el layout y el logo
 * mobile.
 */
export default function AuthSplitLayout({ tagline, benefits, children }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex bg-welve-50">
      {/* Columna izquierda — branding, solo desktop */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #7C5CFC 0%, #5B3FD4 100%)" }}
      >
        {/* Textura decorativa — no compite con el contenido: opacidad baja,
            recortada por el overflow-hidden del panel. Es background-image
            (no <img>) a propósito: este panel entero es hidden en mobile, y
            un <img> se descarga igual aunque esté oculto por CSS — un
            background-image dentro de un ancestro display:none no se pide. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -right-20 h-[280px] w-[420px] bg-contain bg-right-bottom bg-no-repeat opacity-[0.08]"
          style={{ backgroundImage: `url(${decoracionPersonas})` }}
        />

        <img src={logoWelveFull} alt="Welve" className="relative h-20 w-auto object-contain brightness-0 invert" />

        <div className="relative max-w-md animate-fade-up">
          <h1 className="text-4xl font-extrabold leading-tight mb-3">{tagline}</h1>
        </div>

        <ul className="relative space-y-4">
          {benefits.map(({ icon: Icon, label }, i) => (
            <li
              key={label}
              className="flex items-center gap-3 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="text-sm font-medium text-white/90">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Columna derecha — formulario */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-white p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center lg:hidden">
            <img src={logoWelveIcon} alt="Welve" className="h-16 w-16 object-contain" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
