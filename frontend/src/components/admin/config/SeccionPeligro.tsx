import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useDesactivarCuenta } from "../../../hooks/useEmpresa";
import { useAuth } from "../../../context/AuthContext";
import { Button, Input, Modal } from "../../ui";

export default function SeccionPeligro({ nombre }: { nombre: string }) {
  const [showModal, setShowModal] = useState(false);
  const [confirm,  setConfirm]   = useState("");
  const [error, setError] = useState("");
  const desactivar = useDesactivarCuenta();
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleDesactivar() {
    setError("");
    try {
      await desactivar.mutateAsync(confirm);
      logout();
      navigate("/login");
    } catch (e) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "No se pudo desactivar la cuenta.");
    }
  }

  return (
    <div className="max-w-lg">
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-red-500" />
          <h3 className="text-sm font-bold text-red-700">Desactivar cuenta</h3>
        </div>
        <p className="text-xs text-red-600 mb-4">
          Tu cuenta quedará desactivada y no podrás volver a entrar a este panel. Tus clientes,
          cupones y canjes se conservan — contacta a soporte si más adelante quieres reactivarla.
        </p>
        <Button variant="danger" onClick={() => setShowModal(true)}>Desactivar mi cuenta</Button>
      </div>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setConfirm(""); setError(""); }}
        title="Confirmar desactivación"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowModal(false); setConfirm(""); setError(""); }}>Cancelar</Button>
            <Button variant="danger" disabled={confirm !== nombre} loading={desactivar.isPending} onClick={handleDesactivar}>
              Desactivar cuenta
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Para confirmar, escribe el nombre de tu empresa:</p>
          <p className="font-bold text-gray-900 text-sm bg-gray-50 rounded-lg px-3 py-2">{nombre}</p>
          <Input
            value={confirm}
            onChange={(e) => setConfirm((e.target as HTMLInputElement).value)}
            placeholder="Escribe aquí..."
          />
          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
