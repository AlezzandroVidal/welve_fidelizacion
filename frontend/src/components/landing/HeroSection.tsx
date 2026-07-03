import { Link } from "react-router-dom";
import { ArrowRight, Play, Sparkles, Ticket, Trophy, Gift } from "lucide-react";
import AnimateOnScroll from "./AnimateOnScroll";

function FloatingBadge({ icon: Icon, size, className, animation, iconColor }: {
  icon: React.ElementType; size: number; className: string; animation: string; iconColor: string;
}) {
  return (
    <div
      className={`absolute z-10 flex items-center justify-center rounded-full bg-white shadow-xl ${animation} ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon size={size * 0.45} className={iconColor} strokeWidth={1.75} />
    </div>
  );
}

const HERO_IMG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&fit=crop";

export default function HeroSection() {
  return (
    <section className="bg-welve-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24">
        <AnimateOnScroll>
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-welve-600 shadow-sm">
            <Sparkles size={13} /> La plataforma de fidelización #1 para Perú
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.1] text-gray-900 sm:text-5xl">
            Convierte visitas en<br />clientes de por vida
          </h1>
          <p className="mt-5 max-w-md text-base text-gray-600 sm:text-lg">
            Welve ayuda a negocios físicos a retener clientes con cupones inteligentes, retos y
            programas de lealtad. Sin complicaciones, sin comisiones.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-xl bg-welve-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-welve-500/30 transition-all duration-150 hover:bg-welve-600 active:scale-[0.97]"
            >
              Registra tu negocio gratis <ArrowRight size={16} />
            </Link>
            <a
              href="#como-funciona"
              className="flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-white"
            >
              <Play size={16} /> Ver cómo funciona
            </a>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delayMs={120}>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-2xl shadow-welve-900/10">
              <img src={HERO_IMG} alt="Negocio usando Welve" className="h-full w-full object-cover" loading="lazy" />
            </div>
            <FloatingBadge icon={Ticket} size={80} iconColor="text-welve-500" animation="animate-float-1" className="-left-6 -top-6" />
            <FloatingBadge icon={Trophy} size={60} iconColor="text-amber-500" animation="animate-float-2" className="-right-4 top-1/3" />
            <FloatingBadge icon={Gift} size={100} iconColor="text-pink-500" animation="animate-float-3" className="-bottom-8 left-1/4" />
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
