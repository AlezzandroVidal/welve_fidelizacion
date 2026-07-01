import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { usePerfil, useUpdatePerfil, useUploadFoto, useDeleteFoto, useCambiarPassword } from '../../hooks/useWallet';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Toaster } from '../../components/ui';
import PerfilHeader from '../../components/wallet/perfil/PerfilHeader';
import PerfilStats from '../../components/wallet/perfil/PerfilStats';
import MisRelacionesList from '../../components/wallet/perfil/MisRelacionesList';
import FotoModal from '../../components/wallet/perfil/FotoModal';
import EditarPerfilModal from '../../components/wallet/perfil/EditarPerfilModal';
import CambiarPasswordModal from '../../components/wallet/perfil/CambiarPasswordModal';
import type { PerfilUpdateDto } from '../../api/wallet';

function errorDetail(e: unknown, fallback: string): string {
  const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return msg ?? fallback;
}

export default function PerfilPage() {
  const { data, isLoading } = usePerfil();
  const { logout } = useAuth();
  const toast = useToast();

  const [fotoOpen, setFotoOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editarError, setEditarError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const updatePerfil = useUpdatePerfil();
  const uploadFoto = useUploadFoto();
  const deleteFoto = useDeleteFoto();
  const cambiarPassword = useCambiarPassword();

  if (isLoading || !data) {
    return <div className="p-6 text-center animate-pulse">Cargando perfil...</div>;
  }

  const { cliente, resumen, total_canjes, total_empresas, total_puntos_global, racha_maxima_global } = data;

  const handleLogout = () => {
    if (window.confirm("¿Seguro que deseas cerrar sesión?")) logout();
  };

  async function handleGuardarPerfil(update: PerfilUpdateDto) {
    setEditarError('');
    try {
      await updatePerfil.mutateAsync(update);
      setEditarOpen(false);
      toast.success('Perfil actualizado');
    } catch (e) {
      setEditarError(errorDetail(e, 'No se pudo actualizar el perfil.'));
    }
  }

  async function handleGuardarPassword(passwordActual: string | null, passwordNueva: string) {
    setPasswordError('');
    try {
      await cambiarPassword.mutateAsync({ passwordActual, passwordNueva });
      setPasswordOpen(false);
      toast.success('Contraseña actualizada');
    } catch (e) {
      setPasswordError(errorDetail(e, 'No se pudo cambiar la contraseña.'));
    }
  }

  async function handleUploadFoto(dataUri: string) {
    try {
      await uploadFoto.mutateAsync(dataUri);
      setFotoOpen(false);
    } catch (e) {
      toast.error(errorDetail(e, 'No se pudo subir la foto.'));
    }
  }

  async function handleDeleteFoto() {
    try {
      await deleteFoto.mutateAsync();
      setFotoOpen(false);
    } catch (e) {
      toast.error(errorDetail(e, 'No se pudo eliminar la foto.'));
    }
  }

  return (
    <div className="pb-10">
      <PerfilHeader
        cliente={cliente}
        onEditarFoto={() => setFotoOpen(true)}
        onEditarPerfil={() => setEditarOpen(true)}
        onEditarPassword={() => setPasswordOpen(true)}
      />

      <div className="mt-6 px-6">
        <PerfilStats
          totalCanjes={total_canjes}
          totalEmpresas={total_empresas}
          totalPuntos={total_puntos_global}
          rachaMaxima={racha_maxima_global}
        />

        <h2 className="mb-4 px-1 text-lg font-bold text-gray-800">Mis Relaciones</h2>
        <MisRelacionesList resumen={resumen} />

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-rose-500 transition-colors hover:bg-rose-50"
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </div>

      <FotoModal
        open={fotoOpen}
        onClose={() => setFotoOpen(false)}
        currentFoto={cliente.foto_url}
        nombre={cliente.nombre}
        onUpload={handleUploadFoto}
        onDelete={handleDeleteFoto}
        isLoading={uploadFoto.isPending || deleteFoto.isPending}
      />
      <EditarPerfilModal
        open={editarOpen}
        onClose={() => setEditarOpen(false)}
        cliente={cliente}
        onSave={handleGuardarPerfil}
        isLoading={updatePerfil.isPending}
        error={editarError}
      />
      <CambiarPasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        tienePassword={cliente.tiene_password}
        onSave={handleGuardarPassword}
        isLoading={cambiarPassword.isPending}
        error={passwordError}
      />

      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}
