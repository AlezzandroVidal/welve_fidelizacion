import { QrCode } from "lucide-react";

interface Props {
  metodo: "yape" | "plin";
  monto: number;
  numeroTelefono: string;
  numeroOperacion: string;
  onChangeTelefono: (v: string) => void;
  onChangeOperacion: (v: string) => void;
}

const NOMBRE: Record<"yape" | "plin", string> = { yape: "Yape", plin: "Plin" };

export default function YapePlinForm({ metodo, monto, numeroTelefono, numeroOperacion, onChangeTelefono, onChangeOperacion }: Props) {
  const nombre = NOMBRE[metodo];

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 py-6">
        <div className="flex h-36 w-36 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white">
          <QrCode size={72} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-600">Abre tu app {nombre} y escanea el QR</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">S/ {monto.toFixed(2)}</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">Tu número {nombre}</label>
        <input
          inputMode="numeric"
          placeholder="999 999 999"
          value={numeroTelefono}
          onChange={(e) => onChangeTelefono(e.target.value.replace(/\D/g, "").slice(0, 9))}
          className="w-full rounded-xl border-2 border-gray-200 bg-white/70 px-4 py-3 text-sm transition-colors focus:border-welve-500 focus:outline-none focus:ring-[3px] focus:ring-welve-500/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-500">Número de operación {nombre}</label>
        <input
          placeholder="Ej. 000123456"
          value={numeroOperacion}
          onChange={(e) => onChangeOperacion(e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 bg-white/70 px-4 py-3 text-sm font-mono transition-colors focus:border-welve-500 focus:outline-none focus:ring-[3px] focus:ring-welve-500/20"
        />
        <p className="mt-1.5 text-xs text-gray-400">Ingresa el número de operación de tu app para confirmar el pago.</p>
      </div>
    </div>
  );
}
