import { Checkbox, Button } from "../../../ui";
import type { PlanInfo } from "../../../../hooks/usePagos";

const IGV = 0.18;

function formatearPeriodo(): string {
  const inicio = new Date();
  const fin = new Date();
  fin.setDate(fin.getDate() + 30);
  const fmt = (d: Date) => d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  return `${fmt(inicio)} — ${fmt(fin)}`;
}

interface Props {
  plan: PlanInfo;
  descripcionMetodo: string;
  aceptaTerminos: boolean;
  onChangeAcepta: (v: boolean) => void;
  onConfirmar: () => void;
  cargando: boolean;
}

export default function ResumenStep({ plan, descripcionMetodo, aceptaTerminos, onChangeAcepta, onConfirmar, cargando }: Props) {
  const subtotal = plan.precio;
  const igv = subtotal * IGV;
  const total = subtotal + igv;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Plan seleccionado</span>
          <span className="text-sm font-bold text-gray-900">{plan.nombre} · S/ {plan.precio.toFixed(2)}/mes</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Método de pago</span>
          <span className="text-sm font-semibold text-gray-800">{descripcionMetodo}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Período</span>
          <span className="text-sm font-semibold text-gray-800">{formatearPeriodo()}</span>
        </div>

        <div className="border-t border-gray-200 pt-3 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-700 tabular-nums">S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">IGV (18%)</span>
            <span className="text-gray-700 tabular-nums">S/ {igv.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-gray-200">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-welve-600 tabular-nums">S/ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Checkbox
        checked={aceptaTerminos}
        onChange={(e) => onChangeAcepta(e.target.checked)}
        label="Acepto los términos y condiciones de Welve"
      />

      <Button
        onClick={onConfirmar}
        disabled={!aceptaTerminos}
        loading={cargando}
        className="w-full"
        size="lg"
      >
        Pagar S/ {total.toFixed(2)}
      </Button>
    </div>
  );
}
