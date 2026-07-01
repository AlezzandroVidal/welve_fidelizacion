import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Button, Modal } from "../../ui";

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentFoto: string | null;
  nombre: string;
  onUpload: (dataUri: string) => void;
  onDelete: () => void;
  isLoading: boolean;
}

export default function FotoModal({ open, onClose, currentFoto, nombre, onUpload, onDelete, isLoading }: Props) {
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
    setPreview(await fileToDataUri(f));
  }

  const displayed = preview ?? currentFoto;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Foto de perfil"
      size="sm"
      footer={
        <div className="flex w-full items-center gap-2">
          {currentFoto && !preview && (
            <Button variant="danger" onClick={onDelete} loading={isLoading} className="mr-auto">
              Eliminar foto
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="ml-auto">Cancelar</Button>
          {preview ? (
            <Button onClick={() => onUpload(preview)} loading={isLoading}>Guardar foto</Button>
          ) : (
            <Button onClick={() => fileRef.current?.click()}>{currentFoto ? "Cambiar foto" : "Subir foto"}</Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="group relative h-32 w-32 cursor-pointer overflow-hidden rounded-full border-4 border-welve-100 shadow-lg"
          onClick={() => fileRef.current?.click()}
        >
          {displayed ? (
            <img src={displayed} alt={nombre} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-welve-100">
              <span className="text-5xl font-black text-welve-400">{nombre[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera size={22} className="mb-1 text-white" />
            <span className="text-[10px] font-medium text-white">{displayed ? "Cambiar" : "Subir"}</span>
          </div>
        </div>

        {preview && (
          <p className="text-center text-xs font-medium text-welve-600">
            Nueva imagen seleccionada — haz clic en "Guardar foto" para confirmar
          </p>
        )}
        {fileErr && <p className="text-center text-xs text-red-500">{fileErr}</p>}
        <p className="text-center text-[11px] text-gray-400">JPG, PNG o WebP · máx. 2 MB</p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </Modal>
  );
}
