import { Edit2, Package } from "lucide-react";
import type { Producto } from "../../../api/productos";
import { Badge, Table } from "../../ui";
import { stockBadge } from "./stockBadge";

interface Props {
  p: Producto;
  onClick: () => void;
  onEdit: () => void;
}

export default function ProductoTableRow({ p, onClick, onEdit }: Props) {
  const badge = stockBadge(p);

  return (
    <Table.Row onClick={onClick}>
      <Table.Cell>
        {p.imagenUrl ? (
          <img src={p.imagenUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <Package size={16} className="text-gray-300" />
          </div>
        )}
      </Table.Cell>
      <Table.Cell>
        <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
        <p className="font-mono text-[11px] text-gray-400">{p.sku}</p>
      </Table.Cell>
      <Table.Cell className="text-sm text-gray-600">{p.categoria ?? "—"}</Table.Cell>
      <Table.Cell>
        <Badge color={p.tipo === "servicio" ? "purple" : "blue"} size="sm">
          {p.tipo === "servicio" ? "Servicio" : "Producto"}
        </Badge>
      </Table.Cell>
      <Table.Cell className="text-sm font-semibold tabular-nums text-gray-900">S/ {p.precioConIgv.toFixed(2)}</Table.Cell>
      <Table.Cell>
        {p.gestionarInventario ? <Badge color={badge.color} size="sm">{badge.label}</Badge> : <span className="text-xs text-gray-300">—</span>}
      </Table.Cell>
      <Table.Cell>
        <Badge color={p.estado === "activo" ? "green" : p.estado === "agotado" ? "red" : "gray"} size="sm" dot>
          {p.estado}
        </Badge>
      </Table.Cell>
      <Table.Cell className="w-10">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <Edit2 size={15} />
        </button>
      </Table.Cell>
    </Table.Row>
  );
}
