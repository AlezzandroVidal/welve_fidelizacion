import { useState } from "react";
import { Banknote, CreditCard, Smartphone } from "lucide-react";
import type { CarritoCalculado } from "../../../api/caja";
import type { MetodoPagoVenta } from "../../../api/ventas";
import type { DatosPago } from "../../../hooks/useCaja";

interface Props {
  carrito: CarritoCalculado | undefined;
  disabled: boolean;
  cobrando: boolean;
  onCobrar: (datos: DatosPago) => void;
}

const METODOS: { value: MetodoPagoVenta; label: string; icon: typeof Banknote }[] = [
  { value: "efectivo", label: "Efectivo", icon: Banknote },
  { value: "tarjeta", label: "Tarjeta", icon: CreditCard },
  { value: "yape", label: "Yape", icon: Smartphone },
  { value: "plin", label: "Plin", icon: Smartphone },
];

export default function ResumenCobro({ carrito, disabled, cobrando, onCobrar }: Props) {
  const [metodo, setMetodo] = useState<MetodoPagoVenta | null>(null);
  const [montoRecibido, setMontoRecibido] = useState("");

  const total = carrito?.total ?? 0;
  const recibido = parseFloat(montoRecibido) || 0;
  const vuelto = Math.max(0, recibido - total);
  const efectivoInsuficiente = metodo === "efectivo" && montoRecibido !== "" && recibido < total;

  function handleCobrar() {
    if (!metodo) return;
    if (metodo === "efectivo") onCobrar({ metodo_pago: "efectivo", monto_efectivo: recibido || total });
    else if (metodo === "tarjeta") onCobrar({ metodo_pago: "tarjeta", monto_tarjeta: total });
    else onCobrar({ metodo_pago: metodo, monto_yape: metodo === "yape" ? total : undefined });
  }

  const puedeCobrar = !disabled && !!metodo && !efectivoInsuficiente && !cobrando && (carrito?.esValido ?? false);

  return (
    <div className="space-y-4 border-t border-gray-100 pt-4">
      <div className="rounded-2xl border-2 border-gray-100 p-4">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span><span className="tabular-nums">S/ {(carrito?.subtotal ?? 0).toFixed(2)}</span>
        </div>
        {carrito && carrito.descuentoMonto > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Descuento{carrito.cuponAplicado ? ` (${carrito.cuponAplicado.nombre})` : ""}</span>
            <span className="tabular-nums">-S/ {carrito.descuentoMonto.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-500">
          <span>IGV (18%)</span><span className="tabular-nums">S/ {(carrito?.igv ?? 0).toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="text-base font-bold text-gray-900">TOTAL</span>
          <span className="text-3xl font-black tabular-nums text-welve-600">S/ {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {METODOS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMetodo(m.value)}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all
              ${metodo === m.value ? "border-welve-500 bg-welve-50 text-welve-700" : "border-gray-200 text-gray-600 hover:border-welve-300"}`}
          >
            <m.icon size={17} /> {m.label}
          </button>
        ))}
      </div>

      {metodo === "efectivo" && (
        <div>
          <input
            type="number" step="0.01" min="0"
            value={montoRecibido}
            onChange={(e) => setMontoRecibido(e.target.value)}
            placeholder={`Monto recibido (S/ ${total.toFixed(2)})`}
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-base outline-none transition-colors focus:border-welve-500 focus:ring-[3px] focus:ring-welve-500/20"
          />
          {montoRecibido && !efectivoInsuficiente && (
            <p className="mt-1.5 text-sm font-semibold text-green-600">Vuelto: S/ {vuelto.toFixed(2)}</p>
          )}
          {efectivoInsuficiente && (
            <p className="mt-1.5 text-sm font-semibold text-red-500">Falta S/ {(total - recibido).toFixed(2)}</p>
          )}
        </div>
      )}

      <button
        onClick={handleCobrar}
        disabled={!puedeCobrar}
        className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-500/30 transition-all hover:bg-green-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {cobrando ? "Procesando..." : `Cobrar S/ ${total.toFixed(2)}`}
      </button>
    </div>
  );
}
