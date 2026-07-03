import { QrCode, Gift, BarChart3 } from "lucide-react";
import AnimateOnScroll from "./AnimateOnScroll";

const PASOS = [
  {
    icon: QrCode,
    titulo: "El cliente escanea tu QR",
    desc: "Sin apps ni registro: el cliente accede a tu programa de fidelización con una foto a un código.",
  },
  {
    icon: Gift,
    titulo: "Gana beneficios automáticamente",
    desc: "Cupones, retos y recompensas se desbloquean solos según las reglas que tú configuras.",
  },
  {
    icon: BarChart3,
    titulo: "Tú ves todo en tu panel",
    desc: "Métricas, canjes y clientes recurrentes en tiempo real, sin planillas ni cálculos manuales.",
  },
];

export default function ComoFuncionaSection() {
  return (
    <section id="como-funciona" className="bg-white py-20">
      <div className="mx-auto max-w-5xl px-6">
        <AnimateOnScroll className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Tan simple como 1, 2, 3</h2>
        </AnimateOnScroll>

        <div className="grid gap-10 sm:grid-cols-3">
          {PASOS.map((p, i) => (
            <AnimateOnScroll key={p.titulo} delayMs={i * 100} className="text-center">
              <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#7C5CFC20" }}>
                <p.icon size={28} className="text-welve-600" strokeWidth={1.75} />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-welve-500 text-xs font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{p.titulo}</h3>
              <p className="mx-auto max-w-[240px] text-sm leading-relaxed text-gray-500">{p.desc}</p>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
