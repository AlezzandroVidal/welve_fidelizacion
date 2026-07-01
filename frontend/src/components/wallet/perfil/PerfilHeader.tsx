import { Camera, KeyRound, Pencil, QrCode } from "lucide-react";
import type { PerfilCliente } from "../../../api/wallet";

interface Props {
  cliente: PerfilCliente;
  onEditarFoto: () => void;
  onEditarPerfil: () => void;
  onEditarPassword: () => void;
}

export default function PerfilHeader({ cliente, onEditarFoto, onEditarPerfil, onEditarPassword }: Props) {
  return (
    <div className="relative flex flex-col items-center rounded-b-[40px] border-b border-gray-100 bg-white px-6 pb-8 pt-10 shadow-sm">
      <button
        onClick={onEditarFoto}
        className="group relative mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg shadow-welve-500/30"
      >
        {cliente.foto_url ? (
          <img src={cliente.foto_url} alt={cliente.nombre} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-welve-400 to-welve-600 text-3xl font-bold text-white">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera size={20} className="text-white" />
        </div>
      </button>
      <h1 className="text-center text-xl font-bold text-gray-900">{cliente.nombre}</h1>
      {cliente.email && <p className="mt-1 text-sm text-gray-500">{cliente.email}</p>}
      {cliente.whatsapp && <p className="mt-1 text-sm text-gray-500">{cliente.whatsapp}</p>}

      <div className="mt-3 flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1.5 text-white">
        <QrCode size={12} />
        <span className="text-xs font-black tracking-widest">{cliente.codigo_cliente}</span>
      </div>
      <p className="mt-1 max-w-[220px] text-center text-[11px] text-gray-400">
        Tu código Welve — te identifica en cualquier negocio afiliado
      </p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onEditarPerfil}
          className="flex items-center gap-1.5 rounded-full bg-welve-50 px-4 py-1.5 text-xs font-semibold text-welve-600 transition-colors hover:bg-welve-100"
        >
          <Pencil size={12} /> Editar perfil
        </button>
        <button
          onClick={onEditarPassword}
          className="flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-200"
        >
          <KeyRound size={12} /> {cliente.tiene_password ? "Contraseña" : "Crear contraseña"}
        </button>
      </div>
    </div>
  );
}
