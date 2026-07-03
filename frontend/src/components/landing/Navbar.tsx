import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logoWelveFull from "../../resources/logo_welve.svg";

const LINKS = [
  { href: "#caracteristicas", label: "Características" },
  { href: "#precios", label: "Precios" },
  { href: "#contacto", label: "Contacto" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${scrolled ? "shadow-md shadow-gray-200/60" : ""}`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <img src={logoWelveFull} alt="Welve" className="h-8 w-auto object-contain" />

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-gray-600 transition-colors hover:text-welve-600">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden text-sm font-semibold text-gray-600 transition-colors hover:text-welve-600 sm:block">
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-welve-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-welve-600 active:scale-[0.97]"
          >
            Empieza gratis
          </Link>
        </div>
      </nav>
    </header>
  );
}
