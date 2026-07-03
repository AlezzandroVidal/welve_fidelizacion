import { Copy } from "lucide-react";
import { useToast } from "../../../../hooks/useToast";

interface Props {
  monto: number;
  empresaId: string;
}

const DATOS_BANCARIOS = [
  { label: "Banco",             value: "BCP" },
  { label: "Cuenta corriente",  value: "193-12345678-0-12" },
  { label: "CCI",               value: "00219312345678012" },
  { label: "Titular",           value: "WELVE SAC" },
  { label: "RUC",               value: "20612345678" },
];

export default function TransferenciaInfo({ monto, empresaId }: Props) {
  const toast = useToast();
  const referencia = `WLV-${empresaId.slice(-6).toUpperCase()}`;

  function copiar(valor: string) {
    navigator.clipboard.writeText(valor);
    toast.success("Copiado al portapapeles");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 divide-y divide-gray-200">
        {DATOS_BANCARIOS.map((d) => (
          <button
            key={d.label}
            type="button"
            onClick={() => copiar(d.value)}
            className="flex w-full items-center justify-between gap-3 py-2.5 text-left first:pt-0 last:pb-0 group"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase text-gray-400">{d.label}</p>
              <p className="text-sm font-mono font-medium text-gray-800 truncate">{d.value}</p>
            </div>
            <Copy size={14} className="flex-shrink-0 text-gray-300 group-hover:text-welve-500 transition-colors" />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-welve-50 px-4 py-3">
        <span className="text-xs font-semibold text-welve-700">Monto exacto a transferir</span>
        <span className="text-lg font-bold text-welve-700 tabular-nums">S/ {monto.toFixed(2)}</span>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
        <span className="text-xs font-semibold text-gray-500">Referencia a incluir</span>
        <button
          type="button"
          onClick={() => copiar(referencia)}
          className="font-mono text-sm font-semibold text-gray-800 hover:text-welve-600 transition-colors"
        >
          {referencia}
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Envía el voucher de tu transferencia a soporte@welve.pe para acelerar la validación de tu pago.
      </p>
    </div>
  );
}
