import { useState } from "react";
import { Warehouse, Package, AlertTriangle, DollarSign } from "lucide-react";
import type { Producto, TipoMovimiento } from "../../api/productos";
import { useProductos, useAlertasStock, useMovimientosEmpresa } from "../../hooks/useProductos";
import { useToast } from "../../hooks/useToast";
import AjustarStockModal from "../../components/admin/productos/AjustarStockModal";
import { Table, Badge, Select, Toaster } from "../../components/ui";

const MOVIMIENTO_LABEL: Record<string, string> = {
  entrada: "Entrada", salida: "Salida", ajuste: "Ajuste", venta: "Venta", devolucion: "Devolución",
};

const TIPO_OPTIONS = [
  { value: "todos", label: "Todos los tipos" },
  ...Object.entries(MOVIMIENTO_LABEL).map(([value, label]) => ({ value, label })),
];

function StatTile({ icon: Icon, color, label, value }: { icon: typeof Package; color: string; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card flex items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-gray-900 leading-tight truncate">{value}</p>
        <p className="text-[11px] text-gray-400 truncate">{label}</p>
      </div>
    </div>
  );
}

export default function InventarioPage() {
  const { data: productos = [] } = useProductos();
  const { data: alertas = [] } = useAlertasStock();
  const [filtroProducto, setFiltroProducto] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const { data: movimientos = [], isLoading } = useMovimientosEmpresa({
    producto_id: filtroProducto !== "todos" ? filtroProducto : undefined,
    tipo: filtroTipo !== "todos" ? (filtroTipo as TipoMovimiento) : undefined,
    limit: 50,
  });
  const [reponiendo, setReponiendo] = useState<Producto | null>(null);
  const toast = useToast();

  const productosActivos = productos.filter((p) => p.estado !== "inactivo");
  const valorInventario = productos.reduce((acc, p) => acc + (p.gestionarInventario ? p.stockActual * p.precioBase : 0), 0);
  const agotados = productos.filter((p) => p.estado === "agotado").length;
  const productoOptions = [{ value: "todos", label: "Todos los productos" }, ...productos.map((p) => ({ value: p.id, label: p.nombre }))];

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-welve-100">
          <Warehouse size={20} className="text-welve-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
          <p className="text-xs text-gray-400">Stock, alertas y movimientos</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Package} color="#7C5CFC" label="Productos activos" value={productosActivos.length} />
        <StatTile icon={DollarSign} color="#3FD17A" label="Valor de inventario" value={`S/ ${valorInventario.toFixed(2)}`} />
        <StatTile icon={AlertTriangle} color="#EF4444" label="Agotados" value={agotados} />
        <StatTile icon={AlertTriangle} color="#F59E0B" label="En alerta de stock" value={alertas.length} />
      </div>

      <div>
        <h2 className="mb-3 text-base font-bold text-gray-900">Alertas de stock</h2>
        {alertas.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-400 shadow-card">
            Todo el inventario está en niveles saludables.
          </p>
        ) : (
          <div className="space-y-2">
            {alertas.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-card">
                {p.imagenUrl ? (
                  <img src={p.imagenUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100">
                    <Package size={18} className="text-gray-300" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">{p.nombre}</p>
                  <p className="text-xs text-gray-400">Stock: {p.stockActual} / mínimo {p.stockMinimo}</p>
                </div>
                <Badge color={p.stockActual === 0 ? "red" : "yellow"} size="sm">
                  {p.stockActual === 0 ? "AGOTADO" : "STOCK BAJO"}
                </Badge>
                <button
                  onClick={() => setReponiendo(p)}
                  className="flex-shrink-0 rounded-lg bg-welve-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-welve-600"
                >
                  Reponer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-900">Movimientos recientes</h2>
          <div className="flex gap-2">
            <Select options={productoOptions} value={filtroProducto} onChange={setFiltroProducto} className="w-48" />
            <Select options={TIPO_OPTIONS} value={filtroTipo} onChange={setFiltroTipo} className="w-40" />
          </div>
        </div>
        <Table.Root>
          <Table.Header cols={[
            { label: "Producto" }, { label: "Tipo" }, { label: "Cantidad" },
            { label: "Stock resultante" }, { label: "Motivo" }, { label: "Fecha" },
          ]} />
          {isLoading ? (
            <Table.Loading cols={6} />
          ) : !movimientos.length ? (
            <Table.Empty icon={<Warehouse size={36} />} message="Sin movimientos" />
          ) : (
            <Table.Body>
              {movimientos.map((m) => (
                <Table.Row key={m.id}>
                  <Table.Cell>
                    <p className="text-sm text-gray-800">{m.productoNombre ?? "—"}</p>
                    <p className="font-mono text-[10px] text-gray-400">{m.productoSku}</p>
                  </Table.Cell>
                  <Table.Cell><Badge color="gray" size="sm">{MOVIMIENTO_LABEL[m.tipo] ?? m.tipo}</Badge></Table.Cell>
                  <Table.Cell className={`text-sm font-bold tabular-nums ${m.cantidad >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {m.cantidad >= 0 ? "+" : ""}{m.cantidad}
                  </Table.Cell>
                  <Table.Cell className="text-sm tabular-nums text-gray-700">{m.stockNuevo}</Table.Cell>
                  <Table.Cell className="text-xs text-gray-500">{m.motivo ?? "—"}</Table.Cell>
                  <Table.Cell className="text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          )}
        </Table.Root>
      </div>

      <AjustarStockModal producto={reponiendo} onClose={() => setReponiendo(null)} onSuccess={toast.success} />
      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}
