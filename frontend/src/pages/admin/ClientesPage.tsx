import { useState } from "react";
import { Users, Flame, Crown, Clock, Mail, Phone } from "lucide-react";
import { useClientes } from "../../hooks/useClientes";
import { useToast } from "../../hooks/useToast";
import type { Cliente } from "../../api/clientes";
import { Table, Input, Badge, Sheet, Toaster } from "../../components/ui";
import ClienteDetalle, { Avatar } from "../../components/admin/clientes/ClienteDetalle";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
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
  { label: "Cliente" }, { label: "Código" }, { label: "Contacto" }, { label: "Segmento" },
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
    return c.nombre.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s)
      || c.whatsapp?.includes(s) || c.codigoCliente.toLowerCase().includes(s);
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
        <Input variant="search" placeholder="Buscar nombre, código, correo..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64" />
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
          <Table.Loading cols={7} />
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
                  <span className="font-mono text-xs font-semibold text-welve-600">{c.codigoCliente}</span>
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
