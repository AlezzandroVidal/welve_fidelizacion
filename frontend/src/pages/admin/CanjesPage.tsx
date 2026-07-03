import { useMemo, useState } from "react";
import {
  CheckCircle2, Plus, QrCode, Link as LinkIcon, UserCheck, Sparkles, Ticket,
  Download, CalendarDays, TrendingUp, X,
} from "lucide-react";
import { useCanjes } from "../../hooks/useCanjes";
import { useCupon } from "../../hooks/useCupones";
import { useToast } from "../../hooks/useToast";
import CanjeModal from "../../components/admin/canjes/CanjeModal";
import { TIPO_LABEL } from "../../components/admin/cupones/badges";
import { Table, Badge, Sheet, Toaster, Input, Select, Button } from "../../components/ui";
import type { Canje } from "../../api/canjes";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function relativeTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return "ahora";
  if (mins  < 60) return `hace ${mins}min`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

function fmtDatetime(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const CANAL: Record<string, { label: string; icon: typeof QrCode; color: "blue" | "purple" | "gray" | "green" }> = {
  qr:           { label: "QR",         icon: QrCode,    color: "blue"   },
  magic_link:   { label: "Link",       icon: LinkIcon,  color: "purple" },
  staff_manual: { label: "Staff",      icon: UserCheck, color: "gray"   },
  automatico:   { label: "Automático", icon: Sparkles,  color: "green"  },
};

const AVATAR_COLORS = [
  "bg-welve-500", "bg-blue-500", "bg-green-500",
  "bg-orange-500", "bg-pink-500", "bg-teal-500",
];
function hashColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + (h << 5) - h;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

/** Nunca se muestra staffRef crudo (puede traer datos internos de registros
 * viejos: email de login de la empresa, marcador de seed) — el origen se
 * deriva siempre del canal. */
function origenLabel(c: Canje): string {
  if (c.canal === "staff_manual" || c.canal === "qr") return "Registrado manualmente";
  if (c.canal === "automatico") return "Automático";
  return "—";
}

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function descargarCSV(canjes: Canje[]) {
  const header = ["Cliente", "Código", "Cupón", "Canal", "Fecha"];
  const filas = canjes.map((c) => [
    c.clienteNombre ?? "",
    c.clienteCodigo ?? "",
    c.cuponNombre ?? "Cupón eliminado",
    CANAL[c.canal]?.label ?? c.canal,
    fmtDatetime(c.fecha),
  ].map(csvCell).join(","));

  const csv = [header.join(","), ...filas].join("\n");
  const blob = new Blob([String.fromCharCode(0xfeff), csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `canjes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Detalle Sheet ───────────────────────────────────────────────────────── */

function CanjeDetalle({ canje, onClose }: { canje: Canje | null; onClose: () => void }) {
  const { data: cupon } = useCupon(canje?.cuponId ?? null);
  const canalInfo = canje ? (CANAL[canje.canal] ?? { label: canje.canal, icon: QrCode, color: "gray" as const }) : null;
  const CanalIcon = canalInfo?.icon ?? QrCode;

  return (
    <Sheet open={!!canje} onClose={onClose} title={canje?.clienteNombre ?? "Cliente"} subtitle="Detalle del canje">
      {canje && (
        <div className="space-y-5">
          <Badge color={canalInfo!.color as "blue" | "purple" | "gray" | "green"} dot>
            <CanalIcon size={11} className="mr-1" />
            {canalInfo!.label}
          </Badge>

          <div className="flex items-center gap-3 rounded-xl border border-welve-100 bg-welve-50/50 p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-welve-100">
              <Ticket size={18} className="text-welve-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Cupón canjeado</p>
              <p className="text-sm font-bold text-gray-900">{canje.cuponNombre ?? "Cupón eliminado"}</p>
              {cupon && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {TIPO_LABEL[cupon.tipo]}{cupon.valor !== null ? ` · ${cupon.tipo === "porcentual" ? `${cupon.valor}%` : `S/ ${cupon.valor}`}` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Fecha y hora</p>
              <p className="text-sm font-bold text-gray-900">{fmtDatetime(canje.fecha)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{relativeTime(canje.fecha)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Registrado por</p>
              <p className="text-sm font-bold text-gray-900">{origenLabel(canje)}</p>
            </div>
          </div>

          <p className="text-[11px] text-gray-400">
            Este registro es inmutable — un canje nunca se edita ni se anula, es el historial permanente de la redención.
          </p>
        </div>
      )}
    </Sheet>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

const CANALES = [
  { label: "Todos",      value: "todos"        },
  { label: "QR",         value: "qr"           },
  { label: "Link",       value: "magic_link"   },
  { label: "Staff",      value: "staff_manual" },
  { label: "Automático", value: "automatico"   },
];

const TABLE_COLS = [
  { label: "Cliente" }, { label: "Cupón canjeado" },
  { label: "Canal" }, { label: "Fecha" }, { label: "Registrado por" },
];

function KpiTile({ icon: Icon, label, value, sub }: { icon: typeof TrendingUp; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card flex items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-welve-100">
        <Icon size={18} className="text-welve-600" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-gray-900 leading-tight truncate">{value}</p>
        <p className="text-[11px] text-gray-400 truncate">{sub ?? label}</p>
      </div>
    </div>
  );
}

export default function CanjesPage() {
  const { data: canjes = [], isLoading } = useCanjes();
  const toast = useToast();
  const [modalOpen,   setModalOpen]   = useState(false);
  const [filtroCanal, setFiltroCanal] = useState("todos");
  const [filtroCupon, setFiltroCupon] = useState("todos");
  const [busqueda,    setBusqueda]    = useState("");
  const [fechaDesde,  setFechaDesde]  = useState("");
  const [fechaHasta,  setFechaHasta]  = useState("");
  const [detalle,     setDetalle]     = useState<Canje | null>(null);

  const cuponOptions = useMemo(() => {
    const nombrePorCupon = new Map<string, string>();
    canjes.forEach((c) => nombrePorCupon.set(c.cuponId, c.cuponNombre ?? "Cupón eliminado"));
    return [
      { value: "todos", label: "Todos los cupones" },
      ...[...nombrePorCupon.entries()].map(([value, label]) => ({ value, label })),
    ];
  }, [canjes]);

  const filtered = canjes.filter((c) => {
    if (filtroCanal !== "todos" && c.canal !== filtroCanal) return false;
    if (filtroCupon !== "todos" && c.cuponId !== filtroCupon) return false;
    if (fechaDesde && c.fecha < fechaDesde) return false;
    if (fechaHasta && c.fecha.slice(0, 10) > fechaHasta) return false;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      const matchNombre = c.clienteNombre?.toLowerCase().includes(q);
      const matchCodigo = c.clienteCodigo?.toLowerCase().includes(q);
      if (!matchNombre && !matchCodigo) return false;
    }
    return true;
  });

  const counts: Record<string, number> = {
    todos:        canjes.length,
    qr:           canjes.filter((c) => c.canal === "qr").length,
    magic_link:   canjes.filter((c) => c.canal === "magic_link").length,
    staff_manual: canjes.filter((c) => c.canal === "staff_manual").length,
    automatico:   canjes.filter((c) => c.canal === "automatico").length,
  };

  const kpis = useMemo(() => {
    const now = new Date();
    const inicioHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inicioSemana = new Date(inicioHoy);
    inicioSemana.setDate(inicioHoy.getDate() - inicioHoy.getDay());

    const hoy = canjes.filter((c) => new Date(c.fecha) >= inicioHoy).length;
    const semana = canjes.filter((c) => new Date(c.fecha) >= inicioSemana).length;

    const porCupon = new Map<string, { nombre: string; count: number }>();
    canjes.forEach((c) => {
      const nombre = c.cuponNombre ?? "Cupón eliminado";
      const cur = porCupon.get(c.cuponId) ?? { nombre, count: 0 };
      cur.count += 1;
      porCupon.set(c.cuponId, cur);
    });
    const top = [...porCupon.values()].sort((a, b) => b.count - a.count)[0];

    return { hoy, semana, topNombre: top?.nombre ?? "—", topCount: top?.count ?? 0 };
  }, [canjes]);

  const hayFiltrosActivos = filtroCupon !== "todos" || !!busqueda.trim() || !!fechaDesde || !!fechaHasta;

  function limpiarFiltros() {
    setFiltroCupon("todos");
    setBusqueda("");
    setFechaDesde("");
    setFechaHasta("");
  }

  return (
    <main className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-welve-100">
            <CheckCircle2 size={20} className="text-welve-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Historial de canjes</h1>
            <p className="text-xs text-gray-400">{filtered.length} redenciones</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => descargarCSV(filtered)}
            disabled={!filtered.length}
          >
            <Download size={16} /> Exportar CSV
          </Button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-welve-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-welve-600 transition-colors active:scale-[0.97]"
          >
            <Plus size={16} /> Registro manual
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <KpiTile icon={CheckCircle2} label="Canjes hoy" value={kpis.hoy} />
        <KpiTile icon={CalendarDays} label="Canjes esta semana" value={kpis.semana} />
        <KpiTile icon={TrendingUp} label="Cupón más canjeado" value={kpis.topNombre} sub={kpis.topCount ? `${kpis.topCount} canjes · Cupón más canjeado` : "Sin datos aún"} />
      </div>

      {/* Buscador + filtros */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <Input
          variant="search"
          placeholder="Buscar por nombre o código de cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full sm:w-64"
        />
        <Select
          label="Cupón"
          options={cuponOptions}
          value={filtroCupon}
          onChange={setFiltroCupon}
          className="w-full sm:w-56"
        />
        <Input
          type="date"
          label="Desde"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="w-full sm:w-40"
        />
        <Input
          type="date"
          label="Hasta"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="w-full sm:w-40"
        />
        {hayFiltrosActivos && (
          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 mb-4"
          >
            <X size={13} /> Limpiar filtros
          </button>
        )}
      </div>

      {/* Filtro canal pills */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {CANALES.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltroCanal(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all
              ${filtroCanal === f.value ? "bg-welve-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-welve-300 hover:text-welve-600"}`}
          >
            {f.label} <span className={`ml-1 ${filtroCanal === f.value ? "opacity-70" : "text-gray-400"}`}>({counts[f.value]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <Table.Root>
        <Table.Header cols={TABLE_COLS} />
        {isLoading ? (
          <Table.Loading cols={5} />
        ) : !filtered.length ? (
          <Table.Empty
            icon={<CheckCircle2 size={36} />}
            message="Sin canjes en este filtro"
            action={filtroCanal === "todos" ? (
              <button onClick={() => setModalOpen(true)} className="text-sm text-welve-500 hover:underline">
                Registrar primer canje
              </button>
            ) : undefined}
          />
        ) : (
          <Table.Body>
            {filtered.map((c) => {
              const canalInfo = CANAL[c.canal] ?? { label: c.canal, icon: QrCode, color: "gray" };
              const CanalIcon = canalInfo.icon;
              const name = c.clienteNombre ?? "Cliente";

              return (
                <Table.Row key={c.id} onClick={() => setDetalle(c)}>
                  {/* Cliente con avatar */}
                  <Table.Cell>
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold text-white ${hashColor(name)}`}>
                        {initials(name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                        {c.clienteCodigo && (
                          <p className="text-[10px] font-mono text-gray-400">{c.clienteCodigo}</p>
                        )}
                      </div>
                    </div>
                  </Table.Cell>

                  {/* Cupón */}
                  <Table.Cell>
                    <span className="text-sm text-gray-700">{c.cuponNombre ?? "Cupón eliminado"}</span>
                  </Table.Cell>

                  {/* Canal */}
                  <Table.Cell>
                    <Badge color={canalInfo.color as "blue" | "purple" | "gray" | "green"} size="sm">
                      <CanalIcon size={11} className="mr-1" />
                      {canalInfo.label}
                    </Badge>
                  </Table.Cell>

                  {/* Fecha */}
                  <Table.Cell>
                    <span
                      className="text-sm text-gray-700 cursor-default"
                      title={fmtDatetime(c.fecha)}
                    >
                      {relativeTime(c.fecha)}
                    </span>
                    <p className="text-[10px] text-gray-400">{fmtDatetime(c.fecha)}</p>
                  </Table.Cell>

                  {/* Origen del registro */}
                  <Table.Cell className="text-sm text-gray-400">
                    {origenLabel(c)}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        )}
      </Table.Root>

      <CanjeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={toast.success}
        onError={toast.error}
      />
      <CanjeDetalle canje={detalle} onClose={() => setDetalle(null)} />

      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}
