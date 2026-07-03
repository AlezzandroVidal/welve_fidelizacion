import { useMemo, useState } from "react";
import { Receipt, Download } from "lucide-react";
import { useVentas, useResumenVentas } from "../../hooks/useVentas";
import { Table, Badge, Select, Button, Checkbox } from "../../components/ui";
import TicketVenta from "../../components/admin/caja/TicketVenta";
import type { Venta, MetodoPagoVenta } from "../../api/ventas";

const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo", tarjeta: "Tarjeta", yape: "Yape", plin: "Plin", mixto: "Mixto",
};

type RangoFecha = "hoy" | "ayer" | "semana" | "mes" | "todo";

const RANGO_OPTIONS = [
  { value: "hoy", label: "Hoy" },
  { value: "ayer", label: "Ayer" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "todo", label: "Todo" },
];

const METODO_OPTIONS = [
  { value: "todos", label: "Todos los métodos" },
  ...Object.entries(METODO_LABEL).map(([value, label]) => ({ value, label })),
];

function rangoADesdeHasta(rango: RangoFecha): { fecha_desde?: string; fecha_hasta?: string } {
  const ahora = new Date();
  if (rango === "hoy") {
    const inicio = new Date(ahora); inicio.setHours(0, 0, 0, 0);
    return { fecha_desde: inicio.toISOString() };
  }
  if (rango === "ayer") {
    const inicio = new Date(ahora); inicio.setDate(inicio.getDate() - 1); inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio); fin.setHours(23, 59, 59, 999);
    return { fecha_desde: inicio.toISOString(), fecha_hasta: fin.toISOString() };
  }
  if (rango === "semana") {
    const inicio = new Date(ahora); inicio.setDate(inicio.getDate() - inicio.getDay()); inicio.setHours(0, 0, 0, 0);
    return { fecha_desde: inicio.toISOString() };
  }
  if (rango === "mes") {
    return { fecha_desde: new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString() };
  }
  return {};
}

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function descargarCSV(ventas: Venta[]) {
  const header = ["Hora", "Cliente", "Items", "Descuento", "IGV", "Total", "Método", "Cupón"];
  const filas = ventas.map((v) => [
    new Date(v.createdAt).toLocaleString("es-PE"),
    v.clienteNombre ?? "",
    String(v.items.reduce((a, i) => a + i.cantidad, 0)),
    v.descuentoMonto.toFixed(2),
    v.igv.toFixed(2),
    v.total.toFixed(2),
    METODO_LABEL[v.metodoPago] ?? v.metodoPago,
    v.cuponCodigo ?? "",
  ].map(csvCell).join(","));
  const csv = [header.join(","), ...filas].join("\n");
  const blob = new Blob([String.fromCharCode(0xfeff), csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const TABLE_COLS = [
  { label: "#" }, { label: "Hora" }, { label: "Cliente" }, { label: "Items" },
  { label: "Descuento" }, { label: "IGV" }, { label: "Total" }, { label: "Método" }, { label: "Cupón" },
];

export default function VentasPage() {
  const [rango, setRango] = useState<RangoFecha>("hoy");
  const [metodoFiltro, setMetodoFiltro] = useState("todos");
  const [soloConCupon, setSoloConCupon] = useState(false);
  const [detalle, setDetalle] = useState<Venta | null>(null);

  const filtros = useMemo(() => ({
    ...rangoADesdeHasta(rango),
    metodo_pago: metodoFiltro !== "todos" ? (metodoFiltro as MetodoPagoVenta) : undefined,
    con_cupon: soloConCupon ? true : undefined,
  }), [rango, metodoFiltro, soloConCupon]);

  const { data: ventas = [], isLoading } = useVentas(filtros);
  const { data: resumen } = useResumenVentas();

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-welve-100">
          <Receipt size={20} className="text-welve-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ventas</h1>
          <p className="text-xs text-gray-400">Historial de ventas de la Caja</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-2xl font-bold tabular-nums text-gray-900">S/ {(resumen?.montoHoy ?? 0).toFixed(2)}</p>
          <p className="text-xs text-gray-400">{resumen?.ventasHoy ?? 0} ventas hoy</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-2xl font-bold tabular-nums text-gray-900">S/ {(resumen?.ticketPromedioHoy ?? 0).toFixed(2)}</p>
          <p className="text-xs text-gray-400">Ticket promedio hoy</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <Badge color="purple">{resumen?.metodoMasUsadoHoy ? METODO_LABEL[resumen.metodoMasUsadoHoy] ?? resumen.metodoMasUsadoHoy : "—"}</Badge>
          <p className="mt-2 text-xs text-gray-400">Método más usado hoy</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-2xl font-bold tabular-nums text-gray-900">{(resumen?.porcentajeConCuponHoy ?? 0).toFixed(0)}%</p>
          <p className="text-xs text-gray-400">Ventas con cupón hoy</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Select options={RANGO_OPTIONS} value={rango} onChange={(v) => setRango(v as RangoFecha)} className="w-44" />
        <Select options={METODO_OPTIONS} value={metodoFiltro} onChange={setMetodoFiltro} className="w-48" />
        <Checkbox checked={soloConCupon} onChange={(e) => setSoloConCupon(e.target.checked)} label="Solo ventas con cupón" />
        <div className="flex-1" />
        <Button variant="secondary" onClick={() => descargarCSV(ventas)} disabled={!ventas.length}>
          <Download size={16} /> Exportar CSV
        </Button>
      </div>

      <Table.Root>
        <Table.Header cols={TABLE_COLS} />
        {isLoading ? (
          <Table.Loading cols={TABLE_COLS.length} />
        ) : !ventas.length ? (
          <Table.Empty icon={<Receipt size={36} />} message="Sin ventas en este período" />
        ) : (
          <Table.Body>
            {ventas.map((v, i) => (
              <Table.Row key={v.id} onClick={() => setDetalle(v)}>
                <Table.Cell className="text-xs text-gray-400">{i + 1}</Table.Cell>
                <Table.Cell className="text-sm text-gray-700">
                  {new Date(v.createdAt).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </Table.Cell>
                <Table.Cell className="text-sm text-gray-700">{v.clienteNombre ?? "—"}</Table.Cell>
                <Table.Cell className="text-sm tabular-nums text-gray-600">{v.items.reduce((a, item) => a + item.cantidad, 0)}</Table.Cell>
                <Table.Cell className="text-sm tabular-nums text-green-600">{v.descuentoMonto > 0 ? `-S/ ${v.descuentoMonto.toFixed(2)}` : "—"}</Table.Cell>
                <Table.Cell className="text-sm tabular-nums text-gray-600">S/ {v.igv.toFixed(2)}</Table.Cell>
                <Table.Cell className="text-sm font-bold tabular-nums text-gray-900">S/ {v.total.toFixed(2)}</Table.Cell>
                <Table.Cell><Badge color="gray" size="sm">{METODO_LABEL[v.metodoPago] ?? v.metodoPago}</Badge></Table.Cell>
                <Table.Cell className="text-xs text-gray-500">{v.cuponCodigo ?? "—"}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        )}
      </Table.Root>

      <TicketVenta venta={detalle} onClose={() => setDetalle(null)} />
    </main>
  );
}
