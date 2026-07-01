import { useState } from "react";
import { Edit2, Gift, Plus, Trash2, Trophy } from "lucide-react";
import type { RecompensaAutomatica } from "../../../api/qr";
import { useEliminarRecompensaAutomatica, useRecompensasAutomaticas } from "../../../hooks/useQR";
import RecompensaAutomaticaModal from "./RecompensaAutomaticaModal";

interface Props {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function RecompensasAutomaticas({ onSuccess, onError }: Props) {
  const { data: recompensas = [], isLoading } = useRecompensasAutomaticas();
  const eliminar = useEliminarRecompensaAutomatica();

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<RecompensaAutomatica | null>(null);

  function openCreate() { setEditando(null); setModalOpen(true); }
  function openEdit(r: RecompensaAutomatica) { setEditando(r); setModalOpen(true); }

  async function handleDelete(index: number) {
    try {
      await eliminar.mutateAsync(index);
      onSuccess("Recompensa eliminada");
    } catch {
      onError("No se pudo eliminar la recompensa");
    }
  }

  const ordenadas = [...recompensas].sort((a, b) => a.visitasRequeridas - b.visitasRequeridas);

  return (
    <div className="rounded-card border border-gray-100 bg-white p-6 shadow-card">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-welve-100">
            <Trophy size={20} className="text-welve-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Programa de lealtad automático</h2>
            <p className="mt-0.5 max-w-md text-xs text-gray-500">
              Define qué cupón se entrega automáticamente según la cantidad de visitas del cliente.
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-welve-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-welve-600 active:scale-95"
        >
          <Plus size={14} /> Agregar
        </button>
      </div>

      {/* Timeline visual del journey */}
      {ordenadas.length > 0 && (
        <div className="my-6 overflow-x-auto">
          <div className="flex min-w-max items-center gap-1 px-1 py-2">
            {ordenadas.map((r, i) => (
              <div key={r.index} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm ${r.activa ? "bg-welve-500" : "bg-gray-300"}`}>
                    <Gift size={15} />
                  </div>
                  <span className="whitespace-nowrap text-[10px] font-semibold text-gray-600">
                    Visita {r.visitasRequeridas}
                  </span>
                </div>
                {i < ordenadas.length - 1 && <div className="mx-1 h-0.5 w-10 bg-welve-200" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de recompensas configuradas */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
        ) : !recompensas.length ? (
          <p className="py-4 text-center text-sm text-gray-400">Sin recompensas configuradas</p>
        ) : (
          ordenadas.map((r) => (
            <div key={r.index} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5">
              <p className={`text-sm ${r.activa ? "text-gray-700" : "text-gray-400"}`}>
                En la visita <span className="font-bold text-welve-600">{r.visitasRequeridas}</span>
                {" → "}
                <span className="font-semibold">{r.cuponNombre ?? r.descripcion}</span>
                {!r.activa && <span className="ml-2 text-[10px] font-semibold uppercase text-gray-400">Inactiva</span>}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(r)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-welve-50 hover:text-welve-600"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(r.index)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <RecompensaAutomaticaModal
        key={editando?.index ?? "new"}
        open={modalOpen}
        recompensa={editando}
        onClose={() => setModalOpen(false)}
        onSuccess={onSuccess}
        onError={onError}
      />
    </div>
  );
}
