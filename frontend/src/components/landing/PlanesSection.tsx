import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import AnimateOnScroll from "./AnimateOnScroll";

const PLANES = [
  {
    id: "starter", nombre: "Starter", precio: 49, popular: false,
    features: ["Hasta 500 clientes", "5 cupones activos", "QR y magic link", "Dashboard básico", "Soporte por email"],
  },
  {
    id: "growth", nombre: "Growth", precio: 99, popular: true,
    features: ["Hasta 2,000 clientes", "20 cupones activos", "Retos y rachas de visita", "Clientes VIP automáticos", "Soporte prioritario"],
  },
  {
    id: "pro", nombre: "Pro", precio: 199, popular: false,
    features: ["Hasta 10,000 clientes", "100 cupones activos", "Módulo de Caja/POS", "Métricas avanzadas", "Soporte dedicado"],
  },
];

export default function PlanesSection() {
  return (
    <section id="precios" className="bg-white py-20">
      <div className="mx-auto max-w-5xl px-6">
        <AnimateOnScroll className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Planes simples, sin sorpresas</h2>
        </AnimateOnScroll>

        <div className="grid gap-6 md:grid-cols-3 md:items-center">
          {PLANES.map((p, i) => (
            <AnimateOnScroll key={p.id} delayMs={i * 100}>
              <div
                className={`relative flex h-full flex-col rounded-3xl border p-7 ${
                  p.popular ? "border-welve-500 bg-white shadow-2xl shadow-welve-500/15 md:scale-105" : "border-gray-100 bg-white shadow-card"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-welve-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    Más popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{p.nombre}</h3>
                <p className="mt-2">
                  <span className="text-4xl font-black text-gray-900">S/{p.precio}</span>
                  <span className="text-sm text-gray-400">/mes</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check size={16} className="mt-0.5 flex-shrink-0 text-welve-500" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`mt-7 rounded-xl px-5 py-3 text-center text-sm font-bold transition-all duration-150 active:scale-[0.97] ${
                    p.popular ? "bg-welve-500 text-white hover:bg-welve-600" : "bg-welve-50 text-welve-700 hover:bg-welve-100"
                  }`}
                >
                  Empezar con {p.nombre}
                </Link>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
