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
    <div className="space-y-1.5">
      {items.map((item) => {
        const excedeStock = item.producto.gestionarInventario && item.cantidad > item.producto.stockActual;
        return (
          <div key={item.producto.id} className="group rounded-lg border border-gray-100">
            <div className="flex h-14 items-center gap-2 px-2">
              {item.producto.imagenUrl ? (
                <img src={item.producto.imagenUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Package size={14} className="text-gray-300" />
                </div>
              )}
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">{item.producto.nombre}</p>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button
                  onClick={() => onCambiarCantidad(item.producto.id, item.cantidad - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                >
                  <Minus size={12} />
                </button>
                <span className="w-5 text-center text-xs font-bold tabular-nums">{item.cantidad}</span>
                <button
                  onClick={() => onCambiarCantidad(item.producto.id, item.cantidad + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                >
                  <Plus size={12} />
                </button>
              </div>
              <p className="w-16 flex-shrink-0 text-right text-sm font-bold tabular-nums text-gray-900">
                S/ {(item.producto.precioConIgv * item.cantidad).toFixed(2)}
              </p>
              <button
                onClick={() => onQuitar(item.producto.id)}
                className="flex-shrink-0 rounded-md p-1 text-gray-300 opacity-60 transition-colors hover:bg-red-50 hover:text-red-500 hover:opacity-100 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
            {excedeStock && (
              <p className="px-2 pb-1.5 text-[10px] font-medium text-red-500">Solo hay {item.producto.stockActual} en stock</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
