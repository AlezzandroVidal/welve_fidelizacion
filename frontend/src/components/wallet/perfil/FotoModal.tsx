import { useEffect, useState } from "react";
import { Button, Modal, ImageUpload } from "../../ui";

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
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) setPreview(null);
  }, [open]);

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
          {preview && (
            <Button onClick={() => onUpload(preview)} loading={isLoading}>Guardar foto</Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-32">
          <ImageUpload value={displayed} onChange={setPreview} shape="circle" maxSizeMB={1} placeholder={`Foto de ${nombre}`} />
        </div>

        {preview && (
          <p className="text-center text-xs font-medium text-welve-600">
            Nueva imagen seleccionada — haz clic en "Guardar foto" para confirmar
          </p>
        )}
      </div>
    </Modal>
  );
}
