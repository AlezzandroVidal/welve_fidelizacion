import { Minus, Plus, X, Package } from "lucide-react";
import type { ItemCarrito } from "../../../hooks/useCaja";

interface Props {
  items: ItemCarrito[];
  onCambiarCantidad: (productoId: string, cantidad: number) => void;
  onQuitar: (productoId: string) => void;
}

export default function CarritoItems({ items, onCambiarCantidad, onQuitar }: Props) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Package size={28} className="mb-2 text-gray-200" />
        <p className="text-sm text-gray-400">El carrito está vacío</p>
        <p className="text-xs text-gray-300">Agrega productos desde el catálogo</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const excedeStock = item.producto.gestionarInventario && item.cantidad > item.producto.stockActual;
        return (
          <div key={item.producto.id} className="rounded-xl border border-gray-100 p-2.5">
            <div className="flex items-center gap-2.5">
              {item.producto.imagenUrl ? (
                <img src={item.producto.imagenUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Package size={16} className="text-gray-300" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">{item.producto.nombre}</p>
                <p className="font-mono text-[10px] text-gray-400">{item.producto.sku}</p>
              </div>
              <button
                onClick={() => onQuitar(item.producto.id)}
                className="flex-shrink-0 rounded-lg p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <X size={15} />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCambiarCantidad(item.producto.id, item.cantidad - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                >
                  <Minus size={13} />
                </button>
                <span className="w-6 text-center text-sm font-bold tabular-nums">{item.cantidad}</span>
                <button
                  onClick={() => onCambiarCantidad(item.producto.id, item.cantidad + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                >
                  <Plus size={13} />
                </button>
              </div>
              <p className="text-sm font-bold tabular-nums text-gray-900">S/ {(item.producto.precioConIgv * item.cantidad).toFixed(2)}</p>
            </div>
            {excedeStock && (
              <p className="mt-1.5 text-[11px] font-medium text-red-500">Solo hay {item.producto.stockActual} en stock</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
