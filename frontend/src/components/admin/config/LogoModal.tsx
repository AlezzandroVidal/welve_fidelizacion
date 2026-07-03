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
  currentLogo: string | null;
  empresaNombre: string;
  onUpload: (dataUri: string) => void;
  onDelete: () => void;
  isLoading: boolean;
}

export default function LogoModal({
  open, onClose, currentLogo, empresaNombre, onUpload, onDelete, isLoading,
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

  const displayed = preview ?? currentLogo;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Foto de la empresa"
      size="sm"
      footer={
        <div className="flex items-center gap-2 w-full">
          {currentLogo && !preview && (
            <Button variant="danger" onClick={onDelete} loading={isLoading} className="mr-auto">
              Eliminar foto
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="ml-auto">
            Cancelar
          </Button>
          {preview ? (
            <Button onClick={() => onUpload(preview)} loading={isLoading}>
              Guardar foto
            </Button>
          ) : (
            <Button onClick={() => fileRef.current?.click()}>
              {currentLogo ? "Cambiar foto" : "Subir foto"}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-welve-100 shadow-lg cursor-pointer group"
            onClick={() => fileRef.current?.click()}
          >
            {displayed ? (
              <img src={displayed} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-welve-100 flex items-center justify-center">
                <span className="text-5xl font-black text-welve-400">
                  {empresaNombre[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-white mb-1" />
              <span className="text-white text-[10px] font-medium">
                {displayed ? "Cambiar" : "Subir"}
              </span>
            </div>
          </div>

          {preview && (
            <p className="text-xs text-welve-600 font-medium animate-fade-in text-center">
              Nueva imagen seleccionada — haz clic en "Guardar foto" para confirmar
            </p>
          )}
          {!displayed && (
            <p className="text-xs text-gray-400 text-center">
              Haz clic en el círculo o el botón para subir tu logo
            </p>
          )}
        </div>

        {fileErr && <p className="text-xs text-red-500 text-center">{fileErr}</p>}

        <p className="text-[11px] text-gray-400 text-center">JPG, PNG o WebP · máx. 2 MB</p>

        {preview && (
          <button
            className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center"
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
