import { FormEvent, useEffect, useState } from "react";
import { Button, Input, Modal } from "../../ui";
import type { PerfilCliente, PerfilUpdateDto } from "../../../api/wallet";

interface Props {
  open: boolean;
  onClose: () => void;
  cliente: PerfilCliente;
  onSave: (data: PerfilUpdateDto) => void;
  isLoading: boolean;
  error: string;
}

export default function EditarPerfilModal({ open, onClose, cliente, onSave, isLoading, error }: Props) {
  const [nombre, setNombre] = useState(cliente.nombre);
  const [email, setEmail] = useState(cliente.email ?? "");
  const [whatsapp, setWhatsapp] = useState(cliente.whatsapp ?? "");

  useEffect(() => {
    if (open) {
      setNombre(cliente.nombre);
      setEmail(cliente.email ?? "");
      setWhatsapp(cliente.whatsapp ?? "");
    }
  }, [open, cliente]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave({ nombre: nombre.trim(), email: email.trim() || undefined, whatsapp: whatsapp.trim() || undefined });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar perfil"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="editar-perfil-form" loading={isLoading}>Guardar cambios</Button>
        </>
      }
    >
      <form id="editar-perfil-form" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="WhatsApp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      </form>
    </Modal>
  );
}
