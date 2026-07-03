import logoWelveIcon from "../../resources/logo_welve_icon.png";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#1E1B2E] py-8 text-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <img src={logoWelveIcon} alt="Welve" className="h-7 w-7 object-contain" />

        <div className="flex gap-6 text-xs text-white/60">
          <a href="#" className="transition-colors hover:text-white">Términos</a>
          <a href="#" className="transition-colors hover:text-white">Privacidad</a>
          <a href="#" className="transition-colors hover:text-white">Soporte</a>
        </div>

        <p className="text-xs text-white/40">© 2026 Welve. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
