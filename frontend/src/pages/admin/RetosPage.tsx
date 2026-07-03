import { useEffect, useRef, useState } from "react";
import { Target, Plus, Calendar, Gift, Activity, Clock, CheckCircle2, MoreVertical, Ban } from "lucide-react";
import { useRetos, useCancelarReto, useReactivarReto } from "../../hooks/useRetos";
import { useToast } from "../../hooks/useToast";
import type { Reto } from "../../api/retos";
import RetoModal from "../../components/admin/retos/RetoModal";
import { Table, Badge, Sheet, Toaster } from "../../components/ui";

/* ── Types & Helpers ─────────────────────────────────────────────────────── */

type RetoEstado    = "activo" | "programado" | "finalizado" | "cancelado";
type RetoConEstado = Reto & { estado: RetoEstado };

function getEstado(r: Reto): RetoEstado {
  if (r.cancelado) return "cancelado";
  const now = new Date(), inicio = new Date(r.fechaInicio), fin = new Date(r.fechaFin);
  if (now < inicio) return "programado";
  if (now > fin)    return "finalizado";
  return "activo";
}

const ESTADO_COLOR: Record<RetoEstado, "green" | "blue" | "gray" | "red"> = {
  activo: "green", programado: "blue", finalizado: "gray", cancelado: "red",
};
const ESTADO_LABEL: Record<RetoEstado, string> = {
  activo: "Activo", programado: "Programado", finalizado: "Finalizado", cancelado: "Cancelado",
};
const ESTADO_ICON: Record<RetoEstado, React.ReactElement> = {
  activo:     <Activity size={11} />,
  programado: <Clock size={11} />,
  finalizado: <CheckCircle2 size={11} />,
  cancelado:  <Ban size={11} />,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}
function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

const CONDICION_LABEL: Record<Reto["condicionTipo"], string> = {
  num_visitas: "Número de visitas",
  visitas_en_periodo: "Visitas en período",
  monto_acumulado: "Monto acumulado",
  monto_en_periodo: "Monto en período",
  productos_comprados: "Productos comprados",
  puntos_acumulados: "Puntos acumulados",
  monto_en_productos: "Gasto en productos/categoría",
};

function condicionResumen(reto: Reto): { valor: string; label: string } {
  const esMonto = reto.condicionTipo === "monto_acumulado" || reto.condicionTipo === "monto_en_periodo"
    || reto.condicionTipo === "monto_en_productos";
  const valor = esMonto ? `S/ ${reto.condicionValor}` : `${reto.condicionValor}`;
  const sufijoPeriodo = reto.periodoDias ? ` / ${reto.periodoDias}d` : "";
  return { valor: `${valor}${sufijoPeriodo}`, label: CONDICION_LABEL[reto.condicionTipo] };
}

const FILTROS: { label: string; value: "todos" | RetoEstado }[] = [
  { label: "Todos",       value: "todos"      },
  { label: "Activos",     value: "activo"     },
  { label: "Programados", value: "programado" },
  { label: "Finalizados", value: "finalizado" },
  { label: "Cancelados",  value: "cancelado"  },
];

const TABLE_COLS = [
  { label: "Reto" }, { label: "Condición" }, { label: "Período" }, { label: "Recompensa" }, { label: "Estado" }, { label: "" },
];

/* ── Action menu ─────────────────────────────────────────────────────────── */

function ActionMenu({ reto, onView, onEdit }: { reto: RetoConEstado; onView: () => void; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cancelar = useCancelarReto();
  const reactivar = useReactivarReto();

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors active:scale-95"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-lg animate-scale-in origin-top-right">
          {[
            { label: "Ver detalle", action: () => { onView(); setOpen(false); } },
            { label: "Editar", disabled: reto.estado === "cancelado", action: () => { onEdit(); setOpen(false); } },
            reto.estado === "cancelado"
              ? { label: "Reactivar", action: async () => { setOpen(false); await reactivar.mutateAsync(reto.id); } }
              : { label: "Cancelar reto", action: async () => { setOpen(false); await cancelar.mutateAsync(reto.id); }, danger: true },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              disabled={"disabled" in item ? item.disabled : false}
              className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50
                ${"danger" in item && item.danger ? "text-red-500 hover:bg-red-50" : "text-gray-700"}
                ${"disabled" in item && item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Detalle Sheet ───────────────────────────────────────────────────────── */

function RetoDetalle({ reto, onClose }: { reto: RetoConEstado | null; onClose: () => void }) {
  const totalDays   = reto ? Math.max(1, Math.round((new Date(reto.fechaFin).getTime() - new Date(reto.fechaInicio).getTime()) / 86_400_000)) : 1;
  const elapsedDays = reto ? Math.min(totalDays, Math.max(0, Math.round((Date.now() - new Date(reto.fechaInicio).getTime()) / 86_400_000))) : 0;
  const progress    = reto ? (reto.estado === "finalizado" ? 100 : reto.estado === "programado" ? 0 : Math.round((elapsedDays / totalDays) * 100)) : 0;
  const daysLeft    = reto ? Math.max(0, Math.round((new Date(reto.fechaFin).getTime() - Date.now()) / 86_400_000)) : 0;
  const daysUntil   = reto ? Math.max(0, Math.round((new Date(reto.fechaInicio).getTime() - Date.now()) / 86_400_000)) : 0;

  return (
    <Sheet open={!!reto} onClose={onClose} title={reto?.nombre ?? ""} subtitle="Detalle del reto">
      {reto && (
        <div className="space-y-5">
          <Badge color={ESTADO_COLOR[reto.estado]} dot>
            {ESTADO_ICON[reto.estado]}
            <span className="ml-1">{ESTADO_LABEL[reto.estado]}</span>
          </Badge>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-welve-50 p-4">
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Condición</p>
              <p className="text-sm font-bold text-gray-900">{condicionResumen(reto).valor}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{condicionResumen(reto).label}</p>
            </div>
            {reto.estado === "activo" ? (
              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Días restantes</p>
                <p className="text-2xl font-black text-green-700 tabular">{daysLeft}</p>
              </div>
            ) : reto.estado === "programado" ? (
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Inicia en</p>
                <p className="text-2xl font-black text-blue-700 tabular">{daysUntil}d</p>
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Duración</p>
                <p className="text-2xl font-black text-gray-500 tabular">{totalDays}d</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-3">Período</p>
            <div className="flex justify-between text-[10px] text-gray-400 mb-2">
              <span>{fmtDate(reto.fechaInicio)}</span>
              <span>{fmtDate(reto.fechaFin)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-welve-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-right text-[10px] text-gray-400 mt-1">{progress}% transcurrido</p>
          </div>

          {reto.recompensaCuponNombre && (
            <div className="flex items-center gap-3 rounded-xl border border-welve-100 bg-welve-50/50 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-welve-100">
                <Gift size={18} className="text-welve-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Recompensa al completar</p>
                <p className="text-sm font-bold text-gray-900">{reto.recompensaCuponNombre}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function RetosPage() {
  const { data: retos = [], isLoading } = useRetos();
  const toast = useToast();
  const [filtro,    setFiltro]    = useState<"todos" | RetoEstado>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [detalle,   setDetalle]   = useState<RetoConEstado | null>(null);
  const [editando,  setEditando]  = useState<Reto | null>(null);

  const withEstado: RetoConEstado[] = retos.map((r) => ({ ...r, estado: getEstado(r) }));
  const counts: Record<string, number> = {
    todos:      withEstado.length,
    activo:     withEstado.filter((r) => r.estado === "activo").length,
    programado: withEstado.filter((r) => r.estado === "programado").length,
    finalizado: withEstado.filter((r) => r.estado === "finalizado").length,
    cancelado:  withEstado.filter((r) => r.estado === "cancelado").length,
  };
  const filtrados = filtro === "todos" ? withEstado : withEstado.filter((r) => r.estado === filtro);

  return (
    <main className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-welve-100">
            <Target size={20} className="text-welve-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Retos</h1>
            <p className="text-xs text-gray-400">{withEstado.length} retos configurados</p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-welve-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-welve-600 transition-colors active:scale-[0.97]"
        >
          <Plus size={16} /> Crear reto
        </button>
      </div>

      {/* Filtros pills */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all
              ${filtro === f.value ? "bg-welve-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-welve-300 hover:text-welve-600"}`}
          >
            {f.label} <span className={`ml-1 ${filtro === f.value ? "opacity-70" : "text-gray-400"}`}>({counts[f.value]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <Table.Root>
        <Table.Header cols={TABLE_COLS} />
        {isLoading ? (
          <Table.Loading cols={6} />
        ) : !filtrados.length ? (
          <Table.Empty
            icon={<Target size={36} />}
            message={filtro === "todos" ? "Sin retos creados aún" : `Sin retos ${filtro}`}
            action={filtro === "todos" ? (
              <button onClick={() => setModalOpen(true)} className="text-sm text-welve-500 hover:underline">
                Crear primer reto
              </button>
            ) : undefined}
          />
        ) : (
          <Table.Body>
            {filtrados.map((r) => (
              <Table.Row key={r.id} onClick={() => setDetalle(r)}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg
                      ${r.estado === "activo" ? "bg-welve-50 text-welve-600" : r.estado === "programado" ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"}`}>
                      <Target size={16} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{r.nombre}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-sm text-gray-700">{condicionResumen(r).valor}</span>
                  <p className="text-[10px] text-gray-400">{condicionResumen(r).label}</p>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                    <span>{fmtShort(r.fechaInicio)} — {fmtShort(r.fechaFin)}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  {r.recompensaCuponNombre ? (
                    <div className="flex items-center gap-1.5 text-welve-600">
                      <Gift size={13} className="flex-shrink-0" />
                      <span className="text-xs font-medium">{r.recompensaCuponNombre}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Badge color={ESTADO_COLOR[r.estado]} size="sm" dot>
                    {ESTADO_LABEL[r.estado]}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <ActionMenu reto={r} onView={() => setDetalle(r)} onEdit={() => setEditando(r)} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        )}
      </Table.Root>

      <RetoModal
        key={editando ? `reto-edit-${editando.id}` : modalOpen ? "reto-open" : "reto-closed"}
        open={modalOpen || !!editando}
        reto={editando}
        onClose={() => { setModalOpen(false); setEditando(null); }}
        onSuccess={toast.success}
        onError={toast.error}
      />
      <RetoDetalle reto={detalle} onClose={() => setDetalle(null)} />
      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}
