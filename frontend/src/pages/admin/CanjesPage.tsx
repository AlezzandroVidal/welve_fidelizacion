import { useState } from "react";
import { CheckCircle2, Plus, QrCode, Link as LinkIcon, UserCheck, Sparkles, Ticket } from "lucide-react";
import { useCanjes } from "../../hooks/useCanjes";
import { useCupon } from "../../hooks/useCupones";
import { useToast } from "../../hooks/useToast";
import CanjeModal from "../../components/admin/canjes/CanjeModal";
import { TIPO_LABEL } from "../../components/admin/cupones/badges";
import { Table, Badge, Sheet, Toaster } from "../../components/ui";
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
                  {TIPO_LABEL[cupon.tipo]}{cupon.valor !== null ? ` · ${cupon.tipo === "descuento_porcentual" ? `${cupon.valor}%` : `S/ ${cupon.valor}`}` : ""}
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

export default function CanjesPage() {
  const { data: canjes = [], isLoading } = useCanjes();
  const toast = useToast();
  const [modalOpen,    setModalOpen]    = useState(false);
  const [filtroCanal,  setFiltroCanal]  = useState("todos");
  const [detalle,      setDetalle]      = useState<Canje | null>(null);

  const filtered = canjes.filter((c) => filtroCanal === "todos" || c.canal === filtroCanal);

  const counts: Record<string, number> = {
    todos:        canjes.length,
    qr:           canjes.filter((c) => c.canal === "qr").length,
    magic_link:   canjes.filter((c) => c.canal === "magic_link").length,
    staff_manual: canjes.filter((c) => c.canal === "staff_manual").length,
    automatico:   canjes.filter((c) => c.canal === "automatico").length,
  };

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
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-welve-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-welve-600 transition-colors active:scale-[0.97]"
        >
          <Plus size={16} /> Registro manual
        </button>
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
                      <span className="text-sm font-medium text-gray-800">{name}</span>
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
