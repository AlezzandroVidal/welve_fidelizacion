import { useState } from "react";
import { X } from "lucide-react";
import QRScanner from "../staff/QRScanner";
import { Input, Button } from "../../ui";

interface Props {
  open: boolean;
  onClose: () => void;
  onCodigo: (codigo: string) => void;
}

/** Reutiliza el motor de cámara de QRScanner (html5-qrcode) — decodifica
 * tanto QR como códigos de barra 1D si el navegador/cámara lo soporta.
 * Si no hay cámara disponible, cae al input manual. */
export default function BarcodeScannerModal({ open, onClose, onCodigo }: Props) {
  const [manual, setManual] = useState("");

  if (!open) return null;

  function confirmarManual() {
    if (!manual.trim()) return;
    onCodigo(manual.trim());
    setManual("");
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl animate-scale-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Escanear código</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <QRScanner active={open} onScan={(codigo) => onCodigo(codigo)} />

        <div className="my-4 flex items-center gap-2 text-[11px] text-gray-400">
          <div className="h-px flex-1 bg-gray-100" /> o ingresa el código manualmente <div className="h-px flex-1 bg-gray-100" />
        </div>

        <div className="flex gap-2">
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmarManual()}
            placeholder="SKU o código de barras"
            className="flex-1"
          />
          <Button onClick={confirmarManual}>Buscar</Button>
        </div>
      </div>
    </div>
  );
}
