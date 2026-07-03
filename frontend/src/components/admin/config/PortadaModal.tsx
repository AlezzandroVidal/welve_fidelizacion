import { useState, useEffect, useRef } from "react";
import { Camera } from "lucide-react";
import { Button, Modal } from "../../ui";

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentPortada: string | null;
  empresaNombre: string;
  onUpload: (dataUri: string) => void;
  onDelete: () => void;
  isLoading: boolean;
}

export default function PortadaModal({
  open, onClose, currentPortada, empresaNombre, onUpload, onDelete, isLoading,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileErr, setFileErr] = useState("");

  useEffect(() => {
    if (open) { setPreview(null); setFileErr(""); }
  }, [open]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setFileErr("La imagen supera 2 MB"); return; }
    setFileErr("");
    const uri = await fileToDataUri(f);
    setPreview(uri);
  }

  const displayed = preview ?? currentPortada;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Imagen de portada"
      size="sm"
      footer={
        <div className="flex items-center gap-2 w-full">
          {currentPortada && !preview && (
            <Button variant="danger" onClick={onDelete} loading={isLoading} className="mr-auto">
              Eliminar portada
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="ml-auto">
            Cancelar
          </Button>
          {preview ? (
            <Button onClick={() => onUpload(preview)} loading={isLoading}>
              Guardar portada
            </Button>
          ) : (
            <Button onClick={() => fileRef.current?.click()}>
              {currentPortada ? "Cambiar portada" : "Subir portada"}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div
          className="relative aspect-video w-full overflow-hidden rounded-xl border-4 border-welve-100 shadow-lg cursor-pointer group"
          onClick={() => fileRef.current?.click()}
        >
          {displayed ? (
            <img src={displayed} alt="Portada" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-welve-100">
              <span className="text-3xl font-black text-welve-400">{empresaNombre[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera size={22} className="mb-1 text-white" />
            <span className="text-[10px] font-medium text-white">{displayed ? "Cambiar" : "Subir"}</span>
          </div>
        </div>

        {preview && (
          <p className="text-center text-xs font-medium text-welve-600 animate-fade-in">
            Nueva imagen seleccionada — haz clic en "Guardar portada" para confirmar
          </p>
        )}
        {!displayed && (
          <p className="text-center text-xs text-gray-400">
            Se muestra como fondo del encabezado en la app del cliente (formato ancho, 16:9)
          </p>
        )}

        {fileErr && <p className="text-center text-xs text-red-500">{fileErr}</p>}
        <p className="text-center text-[11px] text-gray-400">JPG, PNG o WebP · máx. 2 MB</p>

        {preview && (
          <button
            className="w-full text-center text-xs text-gray-400 underline hover:text-gray-600"
            onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
          >
            Descartar cambio
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </Modal>
  );
}
