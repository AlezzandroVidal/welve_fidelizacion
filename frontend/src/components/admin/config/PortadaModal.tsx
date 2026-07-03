import { useState, useEffect } from "react";
import { Button, Modal, ImageUpload } from "../../ui";

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
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) setPreview(null);
  }, [open]);

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
          {preview && (
            <Button onClick={() => onUpload(preview)} loading={isLoading}>
              Guardar portada
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <ImageUpload
          value={displayed}
          onChange={setPreview}
          shape="landscape"
          placeholder={`Portada de ${empresaNombre}`}
        />

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

        {preview && (
          <button
            className="w-full text-center text-xs text-gray-400 underline hover:text-gray-600"
            onClick={() => setPreview(null)}
          >
            Descartar cambio
          </button>
        )}
      </div>
    </Modal>
  );
}
