import { Star } from "lucide-react";
import AnimateOnScroll from "./AnimateOnScroll";

const TESTIMONIOS = [
  {
    nombre: "María García", negocio: "Café Ritual Lima",
    texto: "Desde que usamos Welve, nuestros clientes regresan 40% más seguido. El sistema de retos es increíble.",
    foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
  },
  {
    nombre: "Carlos Mendoza", negocio: "Salón Lumina",
    texto: "Antes perdíamos clientes después de su primera visita. Ahora el 60% vuelve al mes siguiente.",
    foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
  },
  {
    nombre: "Ana Torres", negocio: "Tienda Maki",
    texto: "Setup en 10 minutos y sin técnicos. Mis clientes escanean el QR y listo. No podría ser más simple.",
    foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
  },
];

export default function TestimoniosSection() {
  return (
    <section className="bg-welve-100 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <AnimateOnScroll className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Lo que dicen nuestros clientes</h2>
        </AnimateOnScroll>

        <div className="grid gap-6 sm:grid-cols-3">
          {TESTIMONIOS.map((t, i) => (
            <AnimateOnScroll key={t.nombre} delayMs={i * 100}>
              <div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-card">
                <div className="mb-3 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={14} fill="currentColor" strokeWidth={0} />)}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-gray-600">"{t.texto}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <img src={t.foto} alt={t.nombre} className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.nombre}</p>
                    <p className="text-xs text-gray-400">{t.negocio}</p>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
