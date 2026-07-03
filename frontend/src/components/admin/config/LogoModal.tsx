import { useState, useEffect } from "react";
import { Button, Modal, ImageUpload } from "../../ui";

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
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) setPreview(null);
  }, [open]);

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
          {preview && (
            <Button onClick={() => onUpload(preview)} loading={isLoading}>
              Guardar foto
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="mx-auto w-32">
          <ImageUpload
            value={displayed}
            onChange={setPreview}
            shape="circle"
            placeholder={`Logo de ${empresaNombre}`}
          />
        </div>

        {preview && (
          <p className="text-xs text-welve-600 font-medium animate-fade-in text-center">
            Nueva imagen seleccionada — haz clic en "Guardar foto" para confirmar
          </p>
        )}

        {preview && (
          <button
            className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center"
            onClick={() => setPreview(null)}
          >
            Descartar cambio
          </button>
        )}
      </div>
    </Modal>
  );
}
