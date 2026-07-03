import { Link } from "react-router-dom";
import AnimateOnScroll from "./AnimateOnScroll";

export default function CTASection() {
  return (
    <section style={{ background: "linear-gradient(135deg, #7C5CFC 0%, #5B3FD4 100%)" }} className="py-20 text-white">
      <AnimateOnScroll className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">¿Listo para fidelizar a tus clientes?</h2>
        <p className="mt-3 text-white/80">Únete a cientos de negocios que ya usan Welve</p>
        <Link
          to="/register"
          className="mt-8 inline-block rounded-xl bg-white px-8 py-4 text-sm font-bold text-welve-600 shadow-lg transition-all duration-150 hover:bg-gray-50 active:scale-[0.97]"
        >
          Crear mi cuenta gratis
        </Link>
        <p className="mt-4 text-xs text-white/60">Sin tarjeta de crédito · Cancela cuando quieras</p>
      </AnimateOnScroll>
    </section>
  );
}
