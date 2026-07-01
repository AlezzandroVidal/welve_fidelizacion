import { X, Edit2, Pause, Play, Ticket } from "lucide-react";
import type { Cupon } from "../../../api/cupones";
import { useCanjesCupon, usePausarCupon, useActivarCupon } from "../../../hooks/useCupones";
import { TIPO_COLOR, TIPO_LABEL, ESTADO_COLOR, ESTADO_LABEL } from "./badges";
import QRDisplay from "../QRDisplay";

interface Props {
  cupon: Cupon | null;
  onClose: () => void;
  onEdit: (c: Cupon) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDatetime(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function CANAL_LABEL(canal: string) {
  return { qr: "QR", magic_link: "Magic link", staff_manual: "Staff", automatico: "Automático" }[canal] ?? canal;
}

export default function CuponDetalle({ cupon, onClose, onEdit, onSuccess, onError }: Props) {
  const pausar  = usePausarCupon();
  const activar = useActivarCupon();
  const { data: canjes, isLoading: loadingCanjes } = useCanjesCupon(cupon?.id ?? null);

  const isOpen = !!cupon;

  async function handlePausar() {
    if (!cupon) return;
    try {
      await pausar.mutateAsync(cupon.id);
      onSuccess("Cupón pausado");
    } catch {
      onError("No se pudo pausar el cupón");
    }
  }

  async function handleActivar() {
    if (!cupon) return;
    try {
      await activar.mutateAsync(cupon.id);
      onSuccess("Cupón activado");
    } catch {
      onError("No se pudo activar el cupón (puede estar expirado)");
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-[250ms]"
        style={{
          transform:      isOpen ? "translateX(0)" : "translateX(100%)",
          transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Ticket size={16} className="text-welve-500" />
            <span className="text-sm font-semibold text-gray-900">Detalle del cupón</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors active:scale-95">
            <X size={16} />
          </button>
        </div>

        {cupon && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Info principal */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-gray-900">{cupon.nombre}</h3>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${ESTADO_COLOR[cupon.estado]}`}>
                  {ESTADO_LABEL[cupon.estado]}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${TIPO_COLOR[cupon.tipo]}`}>
                  {TIPO_LABEL[cupon.tipo]}
                </span>
                {cupon.exclusivo && (
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">VIP</span>
                )}
              </div>
            </div>

            {/* Valor y condiciones */}
            <div className="rounded-xl bg-welve-50 p-4 space-y-2">
              {cupon.valor !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor</span>
                  <span className="font-semibold text-gray-900">
                    {cupon.tipo === "descuento_porcentual" ? `${cupon.valor}%` : `S/ ${cupon.valor}`}
                  </span>
                </div>
              )}
              {cupon.montoMinimo !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monto mínimo</span>
                  <span className="font-semibold text-gray-900">S/ {cupon.montoMinimo}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Vigencia</span>
                <span className="font-semibold text-gray-900 text-right">
                  {fmtDate(cupon.fechaInicio)} → {fmtDate(cupon.fechaExpiracion)}
                </span>
              </div>
            </div>

            {/* Usos */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500">Usos</span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {cupon.usosActuales}{cupon.limiteUsosTotal ? ` / ${cupon.limiteUsosTotal}` : ""}
                </span>
              </div>
              {cupon.limiteUsosTotal ? (
                <div className="h-2 w-full rounded-full bg-welve-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-welve-500 transition-all duration-500"
                    style={{ width: `${Math.min((cupon.usosActuales / cupon.limiteUsosTotal) * 100, 100)}%` }}
                  />
                </div>
              ) : (
                <div className="h-2 w-full rounded-full bg-gray-100" />
              )}
              {cupon.limiteUsosPorCliente && (
                <p className="mt-1 text-xs text-gray-400">{cupon.limiteUsosPorCliente} uso(s) por cliente</p>
              )}
            </div>

            {/* Últimos canjes */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Últimos canjes</h4>
              {loadingCanjes ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : !canjes?.length ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin canjes aún</p>
              ) : (
                <div className="space-y-1.5">
                  {canjes.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                      <span className="text-gray-500 font-mono">{c.clienteId.slice(-6)}</span>
                      <span className="text-gray-400">{CANAL_LABEL(c.canal)}</span>
                      <span className="text-gray-600">{fmtDatetime(c.fecha)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QR de este cupón */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">QR de este cupón</h4>
              <p className="text-xs text-gray-400 mb-3">
                El cliente muestra este QR y tú lo escaneas para validar el canje.
              </p>
              <QRDisplay path={`/qr/cupon/${cupon.id}`} size="sm" />
            </div>
          </div>
        )}

        {/* Footer acciones */}
        {cupon && (
          <div className="border-t border-gray-100 p-4 flex gap-2">
            <button
              onClick={() => onEdit(cupon)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors active:scale-[0.97]"
            >
              <Edit2 size={14} /> Editar
            </button>
            {cupon.estado === "activo" ? (
              <button
                onClick={handlePausar}
                disabled={pausar.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-200 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors active:scale-[0.97] disabled:opacity-60"
              >
                <Pause size={14} /> Pausar
              </button>
            ) : (
              <button
                onClick={handleActivar}
                disabled={activar.isPending || !cupon.estaVigente}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-green-200 py-2 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Play size={14} /> Activar
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
