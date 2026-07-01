import { FormEvent, useEffect, useState } from "react";
import { Button, Input, Modal } from "../../ui";

interface Props {
  open: boolean;
  onClose: () => void;
  tienePassword: boolean;
  onSave: (passwordActual: string | null, passwordNueva: string) => void;
  isLoading: boolean;
  error: string;
}

export default function CambiarPasswordModal({ open, onClose, tienePassword, onSave, isLoading, error }: Props) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [validationErr, setValidationErr] = useState("");

  useEffect(() => {
    if (open) { setActual(""); setNueva(""); setConfirmar(""); setValidationErr(""); }
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (nueva.length < 8) { setValidationErr("La contraseña nueva debe tener al menos 8 caracteres"); return; }
    if (nueva !== confirmar) { setValidationErr("Las contraseñas no coinciden"); return; }
    setValidationErr("");
    onSave(tienePassword ? actual : null, nueva);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tienePassword ? "Cambiar contraseña" : "Crear contraseña"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="password-form" loading={isLoading}>Guardar</Button>
        </>
      }
    >
      <form id="password-form" onSubmit={handleSubmit} className="space-y-4">
        {!tienePassword && (
          <p className="text-xs text-gray-500">
            Todavía no tienes contraseña — entraste con enlace mágico. Crea una para poder iniciar sesión con email y contraseña.
          </p>
        )}
        {tienePassword && (
          <Input
            label="Contraseña actual"
            variant="password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
        )}
        <Input
          label="Contraseña nueva"
          variant="password"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
        />
        <Input
          label="Confirmar contraseña"
          variant="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
        />
        {(validationErr || error) && <p className="text-xs font-medium text-red-500">{validationErr || error}</p>}
      </form>
    </Modal>
  );
}
