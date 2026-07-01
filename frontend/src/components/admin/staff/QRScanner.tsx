import { useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CameraOff } from "lucide-react";

interface Props {
  /** Se llama una sola vez por lectura exitosa — el scanner se pausa hasta que el padre lo reactive. */
  onScan: (decodedText: string) => void;
  active: boolean;
}

/** Escaneo de QR por cámara (html5-qrcode) con la UI propia de Welve en vez del widget por defecto de la librería. */
export default function QRScanner({ onScan, active }: Props) {
  const elementId = `qr-scanner-${useId().replace(/:/g, "")}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;
    let stopped = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          if (stopped) return;
          stopped = true;
          scanner.pause(true);
          onScan(decodedText);
        },
        () => {
          // Frame sin QR detectado — normal en cada intento, se ignora.
        },
      )
      .catch(() => setError("No se pudo acceder a la cámara. Revisa los permisos del navegador."));

    return () => {
      stopped = true;
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, elementId]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 py-10 text-center">
        <CameraOff size={28} className="text-gray-300" />
        <p className="max-w-[220px] text-xs text-gray-500">{error}</p>
      </div>
    );
  }

  return <div id={elementId} className="overflow-hidden rounded-2xl" />;
}
