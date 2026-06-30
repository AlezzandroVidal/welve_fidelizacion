import { useState } from "react";
import {
  Users, Flame, Crown, Clock, Mail, Phone,
  CalendarDays, TrendingUp, Coins,
} from "lucide-react";
import { useClientes } from "../../hooks/useClientes";
import { useCanjes } from "../../hooks/useCanjes";
import { useToast } from "../../hooks/useToast";
import type { Cliente } from "../../api/clientes";
import { Table, Input, Badge, Sheet, Toaster } from "../../components/ui";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const AVATAR_COLORS = [
  "bg-welve-500", "bg-blue-500", "bg-green-500",
  "bg-orange-500", "bg-pink-500", "bg-teal-500", "bg-indigo-500",
];

function hashColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + (h << 5) - h;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDatetime(iso: string) {
  return new Date(iso).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/* ── Avatar ──────────────────────────────────────────────────────────────── */

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const S = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-9 w-9 text-xs";
  return (
    <div className={`${S} ${hashColor(name)} flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white`}>
      {initials(name)}
    </div>
  );
}

/* ── Cliente detalle (Sheet body) ────────────────────────────────────────── */

function ClienteDetalle({ cliente }: { cliente: Cliente }) {
  const { data: canjes } = useCanjes();
  const historial = (canjes ?? [])
    .filter((c) => c.clienteId === cliente.id || c.clienteNombre === cliente.nombre)
    .slice(0, 10);

  const semanas = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (7 - i) * 7);
    return d;
  });

  return (
    <div className="space-y-5">
      {/* Header con avatar */}
      <div className="flex items-center gap-4">
        <Avatar name={cliente.nombre} size="lg" />
        <div>
          <h3 className="text-base font-bold text-gray-900">{cliente.nombre}</h3>
          {cliente.email    && <p className="text-xs text-gray-400">{cliente.email}</p>}
          {cliente.whatsapp && <p className="text-xs text-gray-400">{cliente.whatsapp}</p>}
        </div>
      </div>

      {/* Segmento */}
      <div>
        {cliente.segmento === "exclusivo" ? (
          <Badge color="orange" dot>Exclusivo</Badge>
        ) : (
          <Badge color="gray" dot>Regular</Badge>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Visitas totales", value: cliente.visitasTotales, icon: TrendingUp, color: "text-blue-500" },
          { label: "Puntos",          value: cliente.puntos,         icon: Coins,      color: "text-welve-500" },
          { label: "Racha actual",    value: `${cliente.rachaActual} días`, icon: Flame, color: "text-orange-500" },
          { label: "Monto acumulado", value: `S/ ${cliente.montoAcumulado.toFixed(0)}`, icon: Coins, color: "text-green-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-gray-50 p-3">
            <s.icon size={14} className={`${s.color} mb-1.5`} />
            <p className="text-lg font-black text-gray-900 tabular leading-none">{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Racha visual: círculos por semana */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Racha (8 semanas)</p>
        <div className="flex gap-1.5">
          {semanas.map((_, i) => (
            <div
              key={i}
              title={`Semana ${i + 1}`}
              className={`h-6 flex-1 rounded-md transition-all ${i < cliente.rachaActual ? "bg-orange-400" : "bg-gray-100"}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-300">8 sem. atrás</span>
          <span className="text-[9px] text-gray-300">hoy</span>
        </div>
      </div>

      {/* Última visita + alta */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-gray-500"><Clock size={13} /> Última visita</span>
          <span className="font-medium text-gray-800">{fmtDate(cliente.ultimaVisita)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-gray-500"><CalendarDays size={13} /> Cliente desde</span>
          <span className="font-medium text-gray-800">{fmtDate(cliente.fechaAlta)}</span>
        </div>
      </div>

      {/* Historial de canjes */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Últimos canjes</p>
        {!historial.length ? (
          <p className="text-sm text-gray-400 py-4 text-center">Sin canjes registrados</p>
        ) : (
          <ul className="space-y-1.5">
            {historial.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-xs">
                <span className="font-medium text-gray-700 truncate">{c.cuponNombre ?? "Cupón eliminado"}</span>
                <span className="text-gray-400 flex-shrink-0 ml-2">{fmtDatetime(c.fecha)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

type Filtro = "todos" | "exclusivos" | "recurrentes" | "nuevos";

const FILTROS: { label: string; value: Filtro }[] = [
  { label: "Todos",        value: "todos"       },
  { label: "Exclusivos",   value: "exclusivos"  },
  { label: "Recurrentes",  value: "recurrentes" },
  { label: "Nuevos",       value: "nuevos"      },
];

const TABLE_COLS = [
  { label: "Cliente" }, { label: "Contacto" }, { label: "Segmento" },
  { label: "Visitas" }, { label: "Racha" }, { label: "Última visita" },
];

export default function ClientesPage() {
  const { data: clientes = [], isLoading } = useClientes();
  const toast    = useToast();
  const [search,  setSearch]  = useState("");
  const [filtro,  setFiltro]  = useState<Filtro>("todos");
  const [detalle, setDetalle] = useState<Cliente | null>(null);

  const now7days = Date.now() - 7 * 86_400_000;

  const visibles = clientes.filter((c: Cliente) => {
    if (filtro === "exclusivos")  return c.segmento === "exclusivo";
    if (filtro === "recurrentes") return c.visitasTotales > 1;
    if (filtro === "nuevos")      return new Date(c.fechaAlta).getTime() > now7days;
    return true;
  }).filter((c: Cliente) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.nombre.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.whatsapp?.includes(s);
  });

  const counts: Record<Filtro, number> = {
    todos:       clientes.length,
    exclusivos:  clientes.filter((c: Cliente) => c.segmento === "exclusivo").length,
    recurrentes: clientes.filter((c: Cliente) => c.visitasTotales > 1).length,
    nuevos:      clientes.filter((c: Cliente) => new Date(c.fechaAlta).getTime() > now7days).length,
  };

  return (
    <main className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
            <p className="text-xs text-gray-400">{clientes.length} clientes fidelizados</p>
          </div>
        </div>
        <Input variant="search" placeholder="Buscar nombre, correo..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64" />
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap mb-5">
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
        ) : !visibles.length ? (
          <Table.Empty icon={<Users size={36} />} message="Sin clientes que coincidan" />
        ) : (
          <Table.Body>
            {visibles.map((c: Cliente) => (
              <Table.Row key={c.id} onClick={() => setDetalle(c)}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.nombre} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.nombre}</p>
                      <p className="text-xs text-gray-400">{fmtDate(c.fechaAlta)}</p>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="space-y-0.5">
                    {c.email    && <p className="flex items-center gap-1.5 text-xs text-gray-600"><Mail size={11} className="text-gray-400" />{c.email}</p>}
                    {c.whatsapp && <p className="flex items-center gap-1.5 text-xs text-gray-600"><Phone size={11} className="text-gray-400" />{c.whatsapp}</p>}
                    {!c.email && !c.whatsapp && <span className="text-xs text-gray-300">—</span>}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  {c.segmento === "exclusivo"
                    ? <Badge color="orange" dot size="sm"><Crown size={10} className="mr-0.5" />Exclusivo</Badge>
                    : <Badge color="gray" size="sm">Regular</Badge>}
                </Table.Cell>
                <Table.Cell>
                  <p className="text-sm font-semibold text-gray-700 tabular">{c.visitasTotales}</p>
                  <p className="text-xs text-welve-600">{c.puntos} pts</p>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-1.5">
                    <Flame size={15} className={c.rachaActual > 0 ? "text-orange-500" : "text-gray-200"} />
                    <span className={`text-sm font-bold tabular ${c.rachaActual > 0 ? "text-orange-600" : "text-gray-300"}`}>{c.rachaActual}</span>
                  </div>
                </Table.Cell>
                <Table.Cell className="text-xs text-gray-500">
                  {c.ultimaVisita ? <span className="flex items-center gap-1"><Clock size={11} className="text-gray-400" />{fmtDate(c.ultimaVisita)}</span> : "—"}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        )}
      </Table.Root>

      {/* Sheet detalle */}
      <Sheet
        open={!!detalle}
        onClose={() => setDetalle(null)}
        title={detalle?.nombre}
        subtitle="Perfil del cliente"
      >
        {detalle && <ClienteDetalle cliente={detalle} />}
      </Sheet>

      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}
