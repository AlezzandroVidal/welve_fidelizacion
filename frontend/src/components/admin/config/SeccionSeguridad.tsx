import { useState } from "react";
import { LogOut } from "lucide-react";
import { useCambiarPasswordEmpresa } from "../../../hooks/useEmpresa";
import { useAuth } from "../../../context/AuthContext";
import { Button, Input } from "../../ui";

export default function SeccionSeguridad({ onSaved }: { onSaved: (msg: string) => void }) {
  const cambiarPassword = useCambiarPasswordEmpresa();
  const { logout } = useAuth();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (nueva.length < 8) { setError("La contraseña nueva debe tener al menos 8 caracteres"); return; }
    if (nueva !== confirmar) { setError("Las contraseñas no coinciden"); return; }
    setError("");
    try {
      await cambiarPassword.mutateAsync({ passwordActual: actual, passwordNueva: nueva });
      setActual(""); setNueva(""); setConfirmar("");
      onSaved("Contraseña actualizada");
    } catch (e2) {
      const msg = (e2 as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "No se pudo actualizar la contraseña.");
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <form onSubmit={changePw} className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800">Cambiar contraseña</h3>
        <Input variant="password" label="Contraseña actual" placeholder="••••••••" value={actual} onChange={(e) => setActual(e.target.value)} />
        <Input variant="password" label="Nueva contraseña" placeholder="Mínimo 8 caracteres" value={nueva} onChange={(e) => setNueva(e.target.value)} />
        <Input variant="password" label="Confirmar contraseña" placeholder="Repite la nueva" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        <Button type="submit" loading={cambiarPassword.isPending}>Actualizar contraseña</Button>
      </form>
      <div className="border-t border-gray-100 pt-4">
        {/* Welve usa JWT sin lista de revocación — no hay forma de invalidar sesiones
            en otros dispositivos desde acá, solo cerrar la sesión actual. */}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
