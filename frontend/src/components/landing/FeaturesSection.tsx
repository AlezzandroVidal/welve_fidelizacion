import { Ticket, Trophy, BarChart3, Star, Smartphone, PiggyBank } from "lucide-react";
import AnimateOnScroll from "./AnimateOnScroll";

const FEATURES = [
  { icon: Ticket, titulo: "Cupones inteligentes", desc: "Crea descuentos, 2x1, productos gratis. Tú decides las reglas." },
  { icon: Trophy, titulo: "Retos y misiones", desc: "Motiva a tus clientes con metas que desbloquean recompensas." },
  { icon: BarChart3, titulo: "Dashboard en tiempo real", desc: "Ve métricas, canjes y clientes recurrentes en un solo lugar." },
  { icon: Star, titulo: "Clientes VIP automáticos", desc: "El sistema identifica a tus mejores clientes sin que hagas nada." },
  { icon: Smartphone, titulo: "Sin app que descargar", desc: "Tus clientes acceden por QR desde su celular. Sin fricciones." },
  { icon: PiggyBank, titulo: "Sin comisiones por venta", desc: "Pagas una suscripción fija. Tus ventas son 100% tuyas." },
];

export default function FeaturesSection() {
  return (
    <section id="caracteristicas" className="bg-welve-100 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <AnimateOnScroll className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Todo lo que necesita tu negocio</h2>
        </AnimateOnScroll>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <AnimateOnScroll key={f.titulo} delayMs={(i % 3) * 90}>
              <div className="h-full rounded-2xl bg-white p-6 text-center shadow-card">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-welve-50">
                  <f.icon size={28} className="text-welve-600" strokeWidth={1.75} />
                </div>
                <h3 className="mb-1.5 font-bold text-gray-900">{f.titulo}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
