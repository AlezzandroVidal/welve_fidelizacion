import type { BadgeColor } from "../../ui";
import type { Producto } from "../../../api/productos";

export function stockBadge(p: Producto): { color: BadgeColor; label: string } {
  if (!p.gestionarInventario) return { color: "gray", label: "—" };
  if (p.stockActual === 0) return { color: "red", label: "Agotado" };
  if (p.stockActual <= p.stockMinimo) return { color: "yellow", label: `${p.stockActual}` };
  return { color: "green", label: `${p.stockActual}` };
}
