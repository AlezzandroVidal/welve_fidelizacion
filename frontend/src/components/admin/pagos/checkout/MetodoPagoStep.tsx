import { CreditCard, Smartphone, Landmark } from "lucide-react";
import type { MetodoPago } from "../../../../api/pagos";

const METODOS: { value: MetodoPago; label: string; icon: typeof CreditCard }[] = [
  { value: "tarjeta",       label: "Tarjeta de débito/crédito", icon: CreditCard },
  { value: "yape",          label: "Yape",                      icon: Smartphone },
  { value: "plin",          label: "Plin",                      icon: Smartphone },
  { value: "transferencia", label: "Transferencia bancaria",    icon: Landmark },
];

interface Props {
  value: MetodoPago | null;
  onChange: (m: MetodoPago) => void;
}

export default function MetodoPagoStep({ value, onChange }: Props) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">¿Cómo quieres pagar?</p>
      <div className="grid grid-cols-2 gap-3">
        {METODOS.map((m) => {
          const activo = value === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange(m.value)}
              className={[
                "flex flex-col items-center gap-2.5 rounded-2xl border-2 p-5 text-center transition-all duration-150",
                activo
                  ? "border-welve-500 bg-welve-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-welve-300 hover:bg-welve-50/30",
              ].join(" ")}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${activo ? "bg-welve-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                <m.icon size={20} />
              </div>
              <span className={`text-sm font-semibold ${activo ? "text-welve-700" : "text-gray-700"}`}>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
