import { useState } from "react";
import { Check, HelpCircle, ChevronDown } from "lucide-react";
import {
  detectarMarca, formatearNumeroTarjeta, numeroTarjetaValido,
  formatearVencimiento, vencimientoValido, cvvValido,
} from "../../../../utils/tarjeta";

export interface TarjetaFormData {
  numero: string;
  nombreTitular: string;
  vencimiento: string;
  cvv: string;
  recordar: boolean;
}

interface Props {
  value: TarjetaFormData;
  onChange: (v: TarjetaFormData) => void;
}

function MarcaLogo({ marca }: { marca: "visa" | "mastercard" | "desconocida" }) {
  if (marca === "visa") {
    return (
      <span className="rounded-[4px] bg-[#1A1F71] px-2 py-1 text-[10px] font-black italic text-white">VISA</span>
    );
  }
  if (marca === "mastercard") {
    return (
      <span className="flex items-center -space-x-2.5">
        <span className="h-5 w-5 rounded-full bg-[#EB001B]" />
        <span className="h-5 w-5 rounded-full bg-[#F79E1B] mix-blend-multiply" />
      </span>
    );
  }
  return null;
}

const inputBase = "w-full rounded-xl border-2 bg-white/70 px-4 py-3 text-sm transition-colors duration-150 focus:outline-none focus:ring-[3px]";

export default function TarjetaForm({ value, onChange }: Props) {
  const [tocado, setTocado] = useState({ numero: false, vencimiento: false, cvv: false, nombre: false });
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const digitos = value.numero.replace(/\D/g, "");
  const marca = detectarMarca(digitos);
  const numeroOk = numeroTarjetaValido(value.numero) && marca !== "desconocida";
  const vencimientoOk = vencimientoValido(value.vencimiento);
  const cvvOk = cvvValido(value.cvv);

  function estadoBorde(ok: boolean, tocadoField: boolean, tieneValor: boolean) {
    if (ok) return "border-welve-500 focus:ring-welve-500/20";
    if (tocadoField && tieneValor) return "border-red-300 focus:ring-red-500/20";
    return "border-gray-200 focus:border-welve-500 focus:ring-welve-500/20";
  }

  return (
    <div className="space-y-4">
      {/* Número de tarjeta */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">Número de tarjeta</label>
        <div className="relative">
          <input
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            value={value.numero}
            onChange={(e) => onChange({ ...value, numero: formatearNumeroTarjeta(e.target.value) })}
            onBlur={() => setTocado((t) => ({ ...t, numero: true }))}
            className={`${inputBase} font-mono tracking-wider pr-16 ${estadoBorde(numeroOk, tocado.numero, digitos.length > 0)}`}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {numeroOk && <Check size={16} className="text-welve-500" />}
            <MarcaLogo marca={marca} />
          </div>
        </div>
      </div>

      {/* Vencimiento + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">Vencimiento (MM/AA)</label>
          <input
            inputMode="numeric"
            placeholder="12/28"
            value={value.vencimiento}
            onChange={(e) => onChange({ ...value, vencimiento: formatearVencimiento(e.target.value) })}
            onBlur={() => setTocado((t) => ({ ...t, vencimiento: true }))}
            className={`${inputBase} font-mono ${estadoBorde(vencimientoOk, tocado.vencimiento, value.vencimiento.length > 0)}`}
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-gray-500">
            CVV
            <span title="Los 3 dígitos al reverso de tu tarjeta (4 en Amex)">
              <HelpCircle size={12} className="text-gray-400" />
            </span>
          </label>
          <input
            inputMode="numeric"
            type="password"
            placeholder="•••"
            maxLength={4}
            value={value.cvv}
            onChange={(e) => onChange({ ...value, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            onBlur={() => setTocado((t) => ({ ...t, cvv: true }))}
            className={`${inputBase} font-mono tracking-[0.4em] ${estadoBorde(cvvOk, tocado.cvv, value.cvv.length > 0)}`}
          />
        </div>
      </div>

      {/* Nombre del titular */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">Nombre del titular</label>
        <input
          placeholder="Como aparece en la tarjeta"
          value={value.nombreTitular}
          onChange={(e) => onChange({ ...value, nombreTitular: e.target.value })}
          onBlur={() => setTocado((t) => ({ ...t, nombre: true }))}
          className={`${inputBase} ${estadoBorde(value.nombreTitular.trim().length > 1, tocado.nombre, value.nombreTitular.length > 0)}`}
        />
      </div>

      <label className="flex items-center gap-2.5 pt-1">
        <input
          type="checkbox"
          checked={value.recordar}
          onChange={(e) => onChange({ ...value, recordar: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-welve-500 focus:ring-welve-500/30"
        />
        <span className="text-xs text-gray-500">Recordar tarjeta para futuros pagos</span>
      </label>

      {/* Tarjetas de prueba */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/70">
        <button
          type="button"
          onClick={() => setMostrarAyuda((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-500"
        >
          Tarjetas de prueba
          <ChevronDown size={14} className={`transition-transform ${mostrarAyuda ? "rotate-180" : ""}`} />
        </button>
        {mostrarAyuda && (
          <div className="space-y-1.5 px-4 pb-3 text-xs text-gray-500">
            <p><span className="text-welve-600 font-semibold">4242 4242 4242 4242</span> → Pago aprobado</p>
            <p><span className="text-red-500 font-semibold">4000 0000 0000 0000</span> → Fondos insuficientes</p>
            <p><span className="text-red-500 font-semibold">4111 1111 1111 1111</span> → Tarjeta expirada</p>
          </div>
        )}
      </div>
    </div>
  );
}
