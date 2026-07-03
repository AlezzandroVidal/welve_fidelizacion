import { Package } from "lucide-react";
import type { Producto } from "../../../api/productos";
import { Badge } from "../../ui";
import { stockBadge } from "./stockBadge";

export default function ProductoGridCard({ p, onClick }: { p: Producto; onClick: () => void }) {
  const badge = stockBadge(p);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-card transition-shadow hover:shadow-lg"
    >
      <div className="mb-3 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-50">
        {p.imagenUrl ? (
          <img src={p.imagenUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Package size={32} className="text-gray-200" />
        )}
      </div>
      <div className="mb-1 flex items-center justify-between">
        <Badge color={p.tipo === "servicio" ? "purple" : "blue"} size="sm">
          {p.tipo === "servicio" ? "Servicio" : "Producto"}
        </Badge>
        {p.gestionarInventario && <Badge color={badge.color} size="sm">{badge.label}</Badge>}
      </div>
      <p className="text-sm font-bold text-gray-900">{p.nombre}</p>
      <p className="mb-2 font-mono text-[11px] text-gray-400">{p.sku}</p>
      <p className="text-xl font-black text-gray-900">S/ {p.precioConIgv.toFixed(2)}</p>
      {p.gestionarInventario && p.stockMaximo && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-welve-500"
            style={{ width: `${Math.min(100, (p.stockActual / p.stockMaximo) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
