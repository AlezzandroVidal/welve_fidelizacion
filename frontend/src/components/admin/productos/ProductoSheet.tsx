import { useState } from "react";
import { Package, Printer, Edit2, PauseCircle, PlayCircle, History, TrendingUp } from "lucide-react";
import type { Producto } from "../../../api/productos";
import { useMovimientosProducto, useUpdateProducto } from "../../../hooks/useProductos";
import { useVentas } from "../../../hooks/useVentas";
import { Sheet, Badge, Button } from "../../ui";
import BarcodePreview from "./BarcodePreview";
import AjustarStockModal from "./AjustarStockModal";

const MOVIMIENTO_LABEL: Record<string, string> = {
  entrada: "Entrada", salida: "Salida", ajuste: "Ajuste", venta: "Venta", devolucion: "Devolución",
};

function nivelStock(p: Producto): { color: string; label: string } {
  if (p.stockActual === 0) return { color: "text-red-500", label: "Agotado" };
  if (p.stockActual <= p.stockMinimo) return { color: "text-amber-500", label: "Stock bajo" };
  return { color: "text-green-500", label: "Stock saludable" };
}

function imprimirEtiqueta(producto: Producto) {
  const win = window.open("", "_blank", "width=380,height=420");
  if (!win) return;
  win.document.title = `Etiqueta ${producto.sku}`;
  const body = win.document.body;
  body.style.cssText = "font-family:Arial,sans-serif;padding:24px;text-align:center;";

  const nombre = win.document.createElement("p");
  nombre.style.cssText = "font-weight:700;font-size:14px;margin:0 0 4px;";
  nombre.textContent = producto.nombre;
  body.appendChild(nombre);

  const precio = win.document.createElement("p");
  precio.style.cssText = "font-weight:900;font-size:20px;color:#7C5CFC;margin:0 0 16px;";
  precio.textContent = `S/ ${producto.precioConIgv.toFixed(2)}`;
  body.appendChild(precio);

  const codigo = producto.codigoBarras || producto.sku;
  const barContainer = win.document.createElement("div");
  barContainer.style.cssText = "display:flex;justify-content:center;align-items:flex-end;gap:2px;height:50px;margin-bottom:8px;";
  for (let i = 0; i < codigo.length; i++) {
    const bar = win.document.createElement("div");
    const w = (codigo.charCodeAt(i) % 4) + 1;
    bar.style.cssText = `width:${w}px;height:100%;background:#111;`;
    barContainer.appendChild(bar);
  }
  body.appendChild(barContainer);

  const codigoTexto = win.document.createElement("p");
  codigoTexto.style.cssText = "font-family:monospace;font-size:12px;letter-spacing:2px;color:#444;";
  codigoTexto.textContent = codigo;
  body.appendChild(codigoTexto);

  win.document.close();
  win.focus();
  win.print();
}

interface Props {
  producto: Producto | null;
  onClose: () => void;
  onEdit: (p: Producto) => void;
  onSuccess: (msg: string) => void;
}

export default function ProductoSheet({ producto, onClose, onEdit, onSuccess }: Props) {
  const [ajustando, setAjustando] = useState(false);
  const { data: movimientos = [] } = useMovimientosProducto(producto?.id ?? null, 10);
  const { data: ventas = [] } = useVentas();
  const updateProducto = useUpdateProducto();

  if (!producto) return null;

  const nivel = nivelStock(producto);
  const barraPct = producto.stockMaximo
    ? Math.min(100, (producto.stockActual / producto.stockMaximo) * 100)
    : Math.min(100, (producto.stockActual / (producto.stockMinimo * 4 || 1)) * 100);

  const itemsVendidos = ventas.flatMap((v) => v.items.filter((i) => i.productoId === producto.id));
  const totalVendido = itemsVendidos.reduce((acc, i) => acc + i.cantidad, 0);
  const ingresosGenerados = itemsVendidos.reduce((acc, i) => acc + i.subtotal, 0);

  async function toggleEstado() {
    const nuevoEstado = producto!.estado === "inactivo" ? "activo" : "inactivo";
    await updateProducto.mutateAsync({ id: producto!.id, data: { estado: nuevoEstado } });
    onSuccess(nuevoEstado === "inactivo" ? "Producto inactivado" : "Producto activado");
  }

  return (
    <>
      <Sheet open={!!producto} onClose={onClose} title={producto.nombre} subtitle={producto.sku} width={440}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            {producto.imagenUrl ? (
              <img src={producto.imagenUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-welve-100">
                <Package size={22} className="text-welve-600" />
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              <Badge color={producto.tipo === "servicio" ? "purple" : "blue"} size="sm">
                {producto.tipo === "servicio" ? "Servicio" : "Producto"}
              </Badge>
              <Badge color={producto.estado === "activo" ? "green" : producto.estado === "agotado" ? "red" : "gray"} size="sm" dot>
                {producto.estado}
              </Badge>
              {producto.categoria && <Badge color="gray" size="sm">{producto.categoria}</Badge>}
            </div>
          </div>

          {/* Código de barras / QR */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Código de barras</p>
            <BarcodePreview codigo={producto.codigoBarras || producto.sku} />
            <button
              onClick={() => imprimirEtiqueta(producto)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:border-welve-300 hover:text-welve-600"
            >
              <Printer size={14} /> Imprimir etiqueta
            </button>
          </div>

          {/* Stock */}
          {producto.gestionarInventario && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Stock actual</p>
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-baseline justify-between">
                  <span className={`text-3xl font-black tabular-nums ${nivel.color}`}>{producto.stockActual}</span>
                  <span className={`text-xs font-semibold ${nivel.color}`}>{nivel.label}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className={`h-full rounded-full ${producto.stockActual === 0 ? "bg-red-500" : producto.stockActual <= producto.stockMinimo ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${barraPct}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400">Mínimo: {producto.stockMinimo}{producto.stockMaximo ? ` · Máximo: ${producto.stockMaximo}` : ""}</p>
              </div>
              <Button variant="secondary" onClick={() => setAjustando(true)} className="mt-2 w-full">
                Ajustar stock
              </Button>
            </div>
          )}

          {/* Movimientos */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-400">
              <History size={12} /> Últimos movimientos
            </p>
            {movimientos.length === 0 ? (
              <p className="text-xs text-gray-400">Sin movimientos registrados</p>
            ) : (
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                {movimientos.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <div>
                      <p className="font-semibold text-gray-700">{MOVIMIENTO_LABEL[m.tipo] ?? m.tipo}</p>
                      <p className="text-gray-400">{new Date(m.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}{m.motivo ? ` · ${m.motivo}` : ""}</p>
                    </div>
                    <span className={`font-bold tabular-nums ${m.cantidad >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {m.cantidad >= 0 ? "+" : ""}{m.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ventas del producto */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-400">
              <TrendingUp size={12} /> Ventas del producto
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{totalVendido}</p>
                <p className="text-[10px] text-gray-400">Unidades vendidas</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-900">S/ {ingresosGenerados.toFixed(2)}</p>
                <p className="text-[10px] text-gray-400">Ingresos generados</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => onEdit(producto)}>
              <Edit2 size={14} /> Editar
            </Button>
            <Button variant={producto.estado === "inactivo" ? "primary" : "danger"} className="flex-1" onClick={toggleEstado}>
              {producto.estado === "inactivo" ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
              {producto.estado === "inactivo" ? "Activar" : "Inactivar"}
            </Button>
          </div>
        </div>
      </Sheet>

      <AjustarStockModal
        producto={ajustando ? producto : null}
        onClose={() => setAjustando(false)}
        onSuccess={onSuccess}
      />
    </>
  );
}
