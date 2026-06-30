import { useState } from "react";
import { Crown, Plus, Users, UserPlus, PlayCircle, PauseCircle } from "lucide-react";
import { useMembresias, useSuscripciones, useUpdateSuscripcion } from "../../hooks/useMembresias";
import { useToast } from "../../hooks/useToast";
import type { Membresia, EstadoMembresiaCliente, MembresiaCliente } from "../../api/membresias";
import MembresiaModal from "../../components/admin/membresias/MembresiaModal";
import SuscripcionModal from "../../components/admin/membresias/SuscripcionModal";
import { Table, Badge, Sheet, Toaster } from "../../components/ui";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const FRECUENCIA_LABEL: Record<string, string> = {
  mensual: "Mensual", trimestral: "Trimestral", anual: "Anual",
};
const FRECUENCIA_SUFFIX: Record<string, string> = {
  mensual: "mes", trimestral: "trimestre", anual: "año",
};
const ESTADO_COLOR: Record<EstadoMembresiaCliente, "green" | "orange" | "red"> = {
  activa: "green", vencida: "orange", cancelada: "red",
};
const ESTADO_LABEL: Record<EstadoMembresiaCliente, string> = {
  activa: "Activa", vencida: "Vencida", cancelada: "Cancelada",
};

const AVATAR_COLORS = ["bg-welve-500", "bg-blue-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];
function hashColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + (h << 5) - h;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── Plan Card ───────────────────────────────────────────────────────────── */

function PlanCard({ plan, onSuscribir, onClick }: { plan: Membresia; onSuscribir: () => void; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative flex flex-col bg-white rounded-card border border-gray-100 shadow-card overflow-hidden cursor-pointer
        hover:shadow-[0_4px_20px_rgba(124,92,252,0.12)] hover:-translate-y-px transition-all duration-150 active:scale-[0.99]"
    >
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
            <Crown size={18} className="text-amber-500" />
          </div>
          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 uppercase">
            {FRECUENCIA_LABEL[plan.frecuencia] ?? plan.frecuencia}
          </span>
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">{plan.nombre}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">{plan.beneficioDescripcion}</p>
        <p className="text-3xl font-black text-gray-900 tabular mb-4">
          S/ {plan.precio}
          <span className="text-sm font-normal text-gray-400 ml-1">/{FRECUENCIA_SUFFIX[plan.frecuencia] ?? plan.frecuencia}</span>
        </p>
        <button
          onClick={(e) => { e.stopPropagation(); onSuscribir(); }}
          className="flex items-center justify-center gap-2 rounded-xl bg-welve-500 py-2.5 text-sm font-semibold text-white hover:bg-welve-600 transition-colors active:scale-[0.97]"
        >
          <UserPlus size={15} /> Suscribir cliente
        </button>
      </div>
    </div>
  );
}

/* ── Plan Detalle Sheet ──────────────────────────────────────────────────── */

function PlanDetalle({ plan, subsActivas, onClose, onSuscribir }: {
  plan: Membresia | null; subsActivas: number; onClose: () => void; onSuscribir: () => void;
}) {
  return (
    <Sheet
      open={!!plan}
      onClose={onClose}
      title={plan?.nombre ?? ""}
      subtitle="Detalle del plan"
      footer={
        <button
          onClick={onSuscribir}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-welve-500 py-2.5 text-sm font-semibold text-white hover:bg-welve-600 transition-colors"
        >
          <UserPlus size={15} /> Suscribir cliente
        </button>
      }
    >
      {plan && (
        <div className="space-y-5">
          <div className="rounded-xl bg-amber-50 p-5">
            <p className="text-[10px] text-amber-500 font-semibold uppercase mb-1">Precio</p>
            <p className="text-3xl font-black text-gray-900 tabular">
              S/ {plan.precio}
              <span className="text-sm font-normal text-gray-500 ml-1">/{FRECUENCIA_SUFFIX[plan.frecuencia] ?? plan.frecuencia}</span>
            </p>
            <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
              {FRECUENCIA_LABEL[plan.frecuencia]}
            </span>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-welve-50 p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-welve-100">
              <Users size={18} className="text-welve-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Suscriptores activos</p>
              <p className="text-2xl font-black text-welve-600 tabular">{subsActivas}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mb-2">Descripción del beneficio</p>
            <p className="text-sm text-gray-700 leading-relaxed">{plan.beneficioDescripcion}</p>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

const SUB_COLS = [
  { label: "Cliente" }, { label: "Plan" }, { label: "Inicio" },
  { label: "Próx. cobro" }, { label: "Estado" }, { label: "" },
];

const SUB_FILTROS: { label: string; value: "todos" | EstadoMembresiaCliente }[] = [
  { label: "Todas",      value: "todos"     },
  { label: "Activas",    value: "activa"    },
  { label: "Vencidas",   value: "vencida"   },
  { label: "Canceladas", value: "cancelada" },
];

export default function MembresiasPage() {
  const { data: planes = [], isLoading: loadingPlanes } = useMembresias();
  const { data: suscripciones = [], isLoading: loadingSubs } = useSuscripciones();
  const updateSub = useUpdateSuscripcion();
  const toast = useToast();

  const [tab,          setTab]          = useState<"planes" | "suscriptores">("planes");
  const [planModal,    setPlanModal]    = useState(false);
  const [subModal,     setSubModal]     = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Membresia | null>(null);
  const [detallePlan,  setDetallePlan]  = useState<Membresia | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | EstadoMembresiaCliente>("todos");

  function openSubModal(plan: Membresia) { setSelectedPlan(plan); setSubModal(true); }

  async function handleUpdateStatus(id: string, estado: EstadoMembresiaCliente) {
    try {
      await updateSub.mutateAsync({ id, estado });
      toast.success(`Suscripción ${estado === "activa" ? "reactivada" : "cancelada"}`);
    } catch {
      toast.error("Error al actualizar la suscripción");
    }
  }

  const detallePlanSubs = detallePlan
    ? suscripciones.filter((s: MembresiaCliente) => s.membresiaId === detallePlan.id && s.estado === "activa").length
    : 0;

  const subsFiltradas = filtroEstado === "todos"
    ? suscripciones
    : suscripciones.filter((s: MembresiaCliente) => s.estado === filtroEstado);

  const subCounts: Record<string, number> = {
    todos:     suscripciones.length,
    activa:    suscripciones.filter((s: MembresiaCliente) => s.estado === "activa").length,
    vencida:   suscripciones.filter((s: MembresiaCliente) => s.estado === "vencida").length,
    cancelada: suscripciones.filter((s: MembresiaCliente) => s.estado === "cancelada").length,
  };

  return (
    <main className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Crown size={20} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Membresías</h1>
            <p className="text-xs text-gray-400">{planes.length} planes · {subCounts.activa} suscriptores activos</p>
          </div>
        </div>
        {tab === "planes" && (
          <button
            onClick={() => setPlanModal(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors active:scale-[0.97]"
          >
            <Plus size={16} /> Nuevo plan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 mb-5">
        {[
          { id: "planes",       label: "Planes",       count: planes.length          },
          { id: "suscriptores", label: "Suscriptores", count: suscripciones.length   },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "planes" | "suscriptores")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all
              ${tab === t.id
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600"}`}
          >
            {t.label} <span className={`ml-1 ${tab === t.id ? "opacity-70" : "text-gray-400"}`}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Planes */}
      {tab === "planes" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingPlanes ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-white rounded-card border border-gray-100 shadow-card animate-pulse" />
            ))
          ) : !planes.length ? (
            <div className="col-span-full py-20 text-center bg-white rounded-card shadow-card">
              <Crown size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400">Sin planes configurados</p>
              <button onClick={() => setPlanModal(true)} className="mt-3 text-sm text-welve-500 hover:underline">
                Crear primer plan
              </button>
            </div>
          ) : (
            planes.map((p: Membresia, i: number) => (
              <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <PlanCard plan={p} onSuscribir={() => openSubModal(p)} onClick={() => setDetallePlan(p)} />
              </div>
            ))
          )}
        </div>
      )}

      {/* Suscriptores */}
      {tab === "suscriptores" && (
        <>
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {SUB_FILTROS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltroEstado(f.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all
                  ${filtroEstado === f.value
                    ? "bg-welve-500 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-welve-300 hover:text-welve-600"}`}
              >
                {f.label} <span className={`ml-1 ${filtroEstado === f.value ? "opacity-70" : "text-gray-400"}`}>({subCounts[f.value]})</span>
              </button>
            ))}
          </div>

          <Table.Root>
            <Table.Header cols={SUB_COLS} />
            {loadingSubs ? (
              <Table.Loading cols={6} />
            ) : !subsFiltradas.length ? (
              <Table.Empty
                icon={<Users size={36} />}
                message={filtroEstado === "todos" ? "Sin suscriptores todavía" : `Sin suscripciones ${filtroEstado}`}
              />
            ) : (
              <Table.Body>
                {subsFiltradas.map((sub: MembresiaCliente) => {
                  const plan = planes.find((p: Membresia) => p.id === sub.membresiaId);
                  const name = sub.clienteNombre ?? "Cliente";
                  return (
                    <Table.Row key={sub.id}>
                      <Table.Cell>
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${hashColor(name)}`}>
                            {initials(name)}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{name}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {plan ? (
                          <div className="flex items-center gap-1.5">
                            <Crown size={12} className="text-amber-400" />
                            <span className="text-sm text-gray-700">{plan.nombre}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </Table.Cell>
                      <Table.Cell className="text-sm text-gray-700">{fmtDate(sub.fechaInicio)}</Table.Cell>
                      <Table.Cell className="text-sm text-gray-700">
                        {sub.fechaProximoCobro ? fmtDate(sub.fechaProximoCobro) : "—"}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={ESTADO_COLOR[sub.estado]} size="sm" dot>
                          {ESTADO_LABEL[sub.estado]}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="w-10">
                        {sub.estado === "activa" ? (
                          <button
                            onClick={() => handleUpdateStatus(sub.id, "cancelada")}
                            title="Cancelar suscripción"
                            className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-95"
                          >
                            <PauseCircle size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(sub.id, "activa")}
                            title="Reactivar suscripción"
                            className="rounded-lg p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors active:scale-95"
                          >
                            <PlayCircle size={18} />
                          </button>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            )}
          </Table.Root>
        </>
      )}

      <MembresiaModal
        key={planModal ? "plan-open" : "plan-closed"}
        open={planModal}
        onClose={() => setPlanModal(false)}
        onSuccess={toast.success}
        onError={toast.error}
      />
      <SuscripcionModal
        key={selectedPlan?.id ?? "no-plan"}
        open={subModal}
        onClose={() => { setSubModal(false); setSelectedPlan(null); }}
        planContext={selectedPlan}
        onSuccess={toast.success}
        onError={toast.error}
      />
      <PlanDetalle
        plan={detallePlan}
        subsActivas={detallePlanSubs}
        onClose={() => setDetallePlan(null)}
        onSuscribir={() => { const p = detallePlan; setDetallePlan(null); if (p) openSubModal(p); }}
      />
      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}
