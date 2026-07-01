import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";

export type QRSize = "sm" | "md" | "lg";

const SIZE_PX: Record<QRSize, number> = { sm: 150, md: 200, lg: 280 };

interface Props {
  /** Ruta relativa del frontend que codifica el QR, ej. "/qr/empresa/507f..." */
  path: string;
  size?: QRSize;
  className?: string;
}

export default function QRDisplay({ path, size = "md", className = "" }: Props) {
  const [copied, setCopied] = useState(false);
  const px = SIZE_PX[size];
  const url = `${window.location.origin}${path}`;
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encodeURIComponent(url)}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleDownload() {
    const res = await fetch(qrImgSrc);
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "qr-welve.png";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="rounded-2xl border-2 border-dashed border-welve-200 bg-white p-3 shadow-card">
        <img src={qrImgSrc} width={px} height={px} alt="Código QR" className="rounded-lg" />
      </div>

      <p className="max-w-[220px] truncate text-center text-[11px] text-gray-400" title={url}>
        {url}
      </p>

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 active:scale-95"
        >
          <Download size={13} /> Descargar QR
        </button>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors active:scale-95
            ${copied ? "border-green-200 bg-green-50 text-green-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "¡Copiado!" : "Copiar enlace"}
        </button>
      </div>
    </div>
  );
}
