import { useRef, useState } from "react";
import { Upload, X, Pencil, Loader2, Link2 } from "lucide-react";

export type ImageUploadShape = "square" | "circle" | "landscape";

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string) => void;
  shape?: ImageUploadShape;
  maxSizeMB?: number;
  placeholder?: string;
}

// Sin backend de storage: todo se guarda inline como base64 en Mongo, así que
// 500KB es el techo real pase lo que pase en maxSizeMB — un prop mayor solo
// acorta el rechazo antes de llegar a ese techo.
const TECHO_BASE64_MB = 0.5;

const SHAPE_CLASS: Record<ImageUploadShape, string> = {
  square: "aspect-square rounded-2xl",
  circle: "aspect-square rounded-full",
  landscape: "aspect-[2/1] rounded-2xl",
};

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUpload({
  value, onChange, shape = "square", maxSizeMB = 2, placeholder,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const efectivoMB = Math.min(maxSizeMB, TECHO_BASE64_MB);

  async function procesarArchivo(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen (JPG, PNG, WebP)");
      return;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > efectivoMB) {
      setError(
        sizeMB > maxSizeMB
          ? `La imagen supera ${maxSizeMB}MB`
          : `Imágenes subidas desde el dispositivo deben pesar menos de ${TECHO_BASE64_MB * 1000}KB — usa "Ingresa una URL" para archivos más grandes`,
      );
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      onChange(dataUrl);
    } catch {
      setError("No se pudo procesar la imagen");
    } finally {
      setLoading(false);
    }
  }

  function handleUrlSubmit() {
    const url = urlDraft.trim();
    if (!/^https?:\/\/.+/.test(url)) {
      setError("Ingresa una URL válida (http:// o https://)");
      return;
    }
    setError(null);
    onChange(url);
    setShowUrlInput(false);
    setUrlDraft("");
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) procesarArchivo(file);
        }}
        className={`relative w-full overflow-hidden ${SHAPE_CLASS[shape]} ${
          value ? "" : `flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? "border-welve-500 bg-welve-50" : "border-welve-300 bg-welve-50/40 hover:bg-welve-50"
          }`
        }`}
        onClick={() => !value && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) procesarArchivo(file);
            e.target.value = "";
          }}
        />

        {loading ? (
          <Loader2 size={24} className="animate-spin text-welve-500" />
        ) : value ? (
          <>
            <img src={value} alt={placeholder ?? "Imagen"} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition-transform active:scale-95"
                aria-label="Cambiar imagen"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition-transform active:scale-95"
                aria-label="Eliminar imagen"
              >
                <X size={14} />
              </button>
            </div>
          </>
        ) : (
          <>
            <Upload size={22} className="text-welve-400" />
            <p className="text-xs font-medium text-welve-600">Arrastra una imagen o haz click para seleccionar</p>
            <p className="text-[10px] text-gray-400">JPG, PNG, WebP — máx {maxSizeMB}MB</p>
          </>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-500 animate-fade-up">{error}</p>}

      {!showUrlInput ? (
        <button
          type="button"
          onClick={() => setShowUrlInput(true)}
          className="flex items-center gap-1 text-xs font-medium text-welve-500 hover:underline"
        >
          <Link2 size={11} /> O ingresa una URL
        </button>
      ) : (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            placeholder="https://..."
            autoFocus
            className="min-w-0 flex-1 rounded-lg border border-[#E2DEFF] px-2.5 py-1.5 text-xs outline-none focus:border-welve-500"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="rounded-lg bg-welve-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-welve-600"
          >
            Usar
          </button>
        </div>
      )}
    </div>
  );
}
