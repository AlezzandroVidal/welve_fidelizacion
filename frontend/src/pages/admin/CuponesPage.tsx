import { useEffect, useRef, useState } from "react";
import { Ticket, Plus, MoreVertical, Star, LayoutGrid, LayoutList } from "lucide-react";
import type { Cupon, EstadoCupon } from "../../api/cupones";
import { useCupones, useDeleteCupon, usePausarCupon, useActivarCupon } from "../../hooks/useCupones";
import { useToast } from "../../hooks/useToast";
import CuponModal from "../../components/admin/cupones/CuponModal";
import CuponDetalle from "../../components/admin/cupones/CuponDetalle";
import { TIPO_LABEL, TIPO_COLOR, ESTADO_LABEL } from "../../components/admin/cupones/badges";
import { Table, Input, Badge, Toaster } from "../../components/ui";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── Action menu ─────────────────────────────────────────────────────────── */

function ActionMenu({ cupon, onView, onEdit, onDelete }: {
  cupon: Cupon; onView: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref    = useRef<HTMLDivElement>(null);
  const pausar  = usePausarCupon();
  const activar = useActivarCupon();

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors active:scale-95"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-lg animate-scale-in origin-top-right">
          {[
            { label: "Ver detalle", action: () => { onView(); setOpen(false); } },
            { label: "Editar",      action: () => { onEdit(); setOpen(false); } },
            { label: cupon.estado === "activo" ? "Pausar" : "Activar",
              action: async () => {
                setOpen(false);
                cupon.estado === "activo" ? await pausar.mutateAsync(cupon.id) : await activar.mutateAsync(cupon.id);
              },
            },
            { label: "Eliminar", disabled: cupon.usosActuales > 0, action: () => { onDelete(); setOpen(false); }, danger: true },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              disabled={item.disabled}
              title={item.disabled ? "Tiene canjes — no se puede eliminar" : undefined}
              className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50
                ${item.danger ? "text-red-500 hover:bg-red-50" : "text-gray-700"}
                ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Grid card ───────────────────────────────────────────────────────────── */

const TIPO_GRADIENT: Record<string, string> = {
  descuento_porcentual: "from-blue-50 to-blue-100/50",
  descuento_fijo:       "from-green-50 to-green-100/50",
  producto_gratis:      "from-welve-50 to-welve-100/50",
  dos_por_uno:          "from-orange-50 to-orange-100/50",
};

function CuponCard({ c, onClick }: { c: Cupon; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-card overflow-hidden cursor-pointer bg-gradient-to-br ${TIPO_GRADIENT[c.tipo] ?? "from-gray-50 to-gray-100/50"}
        border border-white shadow-card hover:shadow-[0_4px_20px_rgba(124,92,252,0.12)] transition-all duration-150 hover:-translate-y-px active:scale-[0.99]`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">{c.nombre}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${TIPO_COLOR[c.tipo]}`}>{TIPO_LABEL[c.tipo]}</span>
              {c.exclusivo && <Star size={11} className="text-amber-400 fill-amber-400" />}
            </div>
          </div>
          <Badge color={c.estado === "activo" ? "green" : c.estado === "pausado" ? "yellow" : "gray"} size="sm" dot>
            {ESTADO_LABEL[c.estado]}
          </Badge>
        </div>

        {c.valor !== null && (
          <p className="text-2xl font-black text-gray-800 tabular mb-3">
            {c.tipo === "descuento_porcentual" ? `${c.valor}%` : `S/ ${c.valor}`}
          </p>
        )}

        {c.limiteUsosTotal ? (
          <div>
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>Usos</span>
              <span className="tabular">{c.usosActuales}/{c.limiteUsosTotal}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-welve-500 transition-all duration-500"
                style={{ width: `${Math.min((c.usosActuales / c.limiteUsosTotal) * 100, 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-gray-400">{c.usosActuales} usos</p>
        )}

        <p className="mt-2 text-[10px] text-gray-400">Vence {fmtFecha(c.fechaExpiracion)}</p>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

const ESTADOS: { label: string; value?: EstadoCupon }[] = [
  { label: "Todos" },
  { label: "Activos",   value: "activo"   },
  { label: "Pausados",  value: "pausado"  },
  { label: "Expirados", value: "expirado" },
];

type View = "table" | "grid";

const TABLE_COLS = [
  { label: "Nombre" }, { label: "Tipo" }, { label: "Valor" },
  { label: "Vigencia" }, { label: "Usos" }, { label: "Estado" }, { label: "" },
];

export default function CuponesPage() {
  const [filtro, setFiltro]       = useState<EstadoCupon | undefined>();
  const [search, setSearch]       = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCupon, setEditCupon] = useState<Cupon | null>(null);
  const [detalle, setDetalle]     = useState<Cupon | null>(null);
  const [view, setView]           = useState<View>(() => (localStorage.getItem("cupones_view") as View) ?? "table");
  const toast                     = useToast();
  const deleteMut                 = useDeleteCupon();
  const { data: all = [], isLoading } = useCupones();

  function switchView(v: View) {
    setView(v);
    localStorage.setItem("cupones_view", v);
  }

  const cupones = all
    .filter((c) => !filtro || c.estado === filtro)
    .filter((c) => !search || c.nombre.toLowerCase().includes(search.toLowerCase()));

  const counts: Record<string, number> = {
    activo:   all.filter((c) => c.estado === "activo").length,
    pausado:  all.filter((c) => c.estado === "pausado").length,
    expirado: all.filter((c) => c.estado === "expirado").length,
  };

  function openCreate() { setEditCupon(null); setModalOpen(true); }
  function openEdit(c: Cupon) { setEditCupon(c); setModalOpen(true); }

  async function handleDelete(c: Cupon) {
    if (!confirm(`¿Eliminar "${c.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteMut.mutateAsync(c.id);
      toast.success("Cupón eliminado");
      if (detalle?.id === c.id) setDetalle(null);
    } catch {
      toast.error("No se pudo eliminar el cupón");
    }
  }

  return (
    <main className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-welve-100">
            <Ticket size={20} className="text-welve-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cupones</h1>
            <p className="text-xs text-gray-400">{all.length} cupones</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-welve-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-welve-600 transition-colors active:scale-[0.97]"
        >
          <Plus size={16} /> Nuevo cupón
        </button>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Filtro pills */}
        <div className="flex gap-1.5 flex-wrap">
          {ESTADOS.map((f) => {
            const count = f.value ? counts[f.value] : all.length;
            const active = filtro === f.value;
            return (
              <button
                key={f.label}
                onClick={() => setFiltro(f.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all
                  ${active ? "bg-welve-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-welve-300 hover:text-welve-600"}`}
              >
                {f.label} <span className={`ml-1 ${active ? "opacity-70" : "text-gray-400"}`}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <Input
          variant="search"
          placeholder="Buscar cupón..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-52"
        />

        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {[
            { v: "table" as View, icon: LayoutList },
            { v: "grid"  as View, icon: LayoutGrid },
          ].map(({ v, icon: Icon }) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className={`px-3 py-2 transition-colors ${view === v ? "bg-welve-500 text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* Table view */}
      {view === "table" && (
        <Table.Root>
          <Table.Header cols={TABLE_COLS} />
          {isLoading ? (
            <Table.Loading cols={7} />
          ) : !cupones.length ? (
            <Table.Empty
              icon={<Ticket size={36} />}
              message={search ? "Sin cupones que coincidan" : "Sin cupones aún"}
              action={!search ? (
                <button onClick={openCreate} className="text-sm text-welve-500 hover:underline">
                  Crear primer cupón
                </button>
              ) : undefined}
            />
          ) : (
            <Table.Body>
              {cupones.map((c) => (
                <Table.Row key={c.id} onClick={() => setDetalle(c)}>
                  <Table.Cell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-800">{c.nombre}</span>
                      {c.exclusivo && <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={c.tipo === "descuento_porcentual" ? "blue" : c.tipo === "descuento_fijo" ? "green" : c.tipo === "producto_gratis" ? "purple" : "orange"} size="sm">
                      {TIPO_LABEL[c.tipo]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-sm text-gray-700 tabular">
                    {c.valor !== null ? (c.tipo === "descuento_porcentual" ? `${c.valor}%` : `S/ ${c.valor}`) : "—"}
                  </Table.Cell>
                  <Table.Cell className="text-xs text-gray-500">{fmtFecha(c.fechaExpiracion)}</Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular text-gray-700">
                        {c.usosActuales}{c.limiteUsosTotal ? `/${c.limiteUsosTotal}` : ""}
                      </span>
                      {c.limiteUsosTotal && (
                        <div className="w-14 h-1.5 rounded-full bg-welve-100 overflow-hidden">
                          <div className="h-full rounded-full bg-welve-500" style={{ width: `${Math.min((c.usosActuales / c.limiteUsosTotal) * 100, 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={c.estado === "activo" ? "green" : c.estado === "pausado" ? "yellow" : "gray"} size="sm" dot>
                      {ESTADO_LABEL[c.estado]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="w-10" >
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionMenu cupon={c} onView={() => setDetalle(c)} onEdit={() => openEdit(c)} onDelete={() => handleDelete(c)} />
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          )}
        </Table.Root>
      )}

      {/* Grid view */}
      {view === "grid" && (
        <div>
          {!cupones.length && !isLoading ? (
            <div className="py-20 text-center">
              <Ticket size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400">Sin cupones que mostrar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cupones.map((c, i) => (
                <div key={c.id} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <CuponCard c={c} onClick={() => setDetalle(c)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <CuponModal
        key={editCupon?.id ?? "new"}
        open={modalOpen}
        cupon={editCupon}
        onClose={() => setModalOpen(false)}
        onSuccess={toast.success}
      />

      <CuponDetalle
        cupon={detalle}
        onClose={() => setDetalle(null)}
        onEdit={(c) => { setDetalle(null); openEdit(c); }}
        onSuccess={toast.success}
        onError={toast.error}
      />

      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}
