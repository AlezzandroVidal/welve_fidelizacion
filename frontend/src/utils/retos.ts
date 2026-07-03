export function descripcionCondicion(tipo: string, meta: number, periodoDias?: number | null): string {
  switch (tipo) {
    case "num_visitas": return `Visita ${meta} veces y gana tu recompensa`;
    case "visitas_en_periodo": return `Visita ${meta} veces en ${periodoDias ?? "N"} días`;
    case "monto_acumulado": return `Acumula S/${meta} en compras`;
    case "monto_en_periodo": return `Gasta S/${meta} en ${periodoDias ?? "N"} días`;
    case "productos_comprados": return `Compra ${meta} unidades del producto seleccionado`;
    case "monto_en_productos": return `Gasta S/${meta} en los productos seleccionados`;
    case "puntos_acumulados": return `Acumula ${meta} puntos`;
    default: return `Alcanza la meta de ${meta}`;
  }
}

export function comoCompletarlo(tipo: string, empresaNombre: string, periodoDias?: number | null): string {
  switch (tipo) {
    case "num_visitas":
      return `Cada vez que el staff registre tu visita en ${empresaNombre} suma para este reto.`;
    case "visitas_en_periodo":
      return `Cada visita registrada por el staff de ${empresaNombre} cuenta, siempre que caiga dentro de los últimos ${periodoDias ?? "N"} días.`;
    case "monto_acumulado":
    case "monto_en_periodo":
      return `Cada compra que realices en ${empresaNombre} cuenta para este reto.`;
    case "productos_comprados":
    case "monto_en_productos":
      return `Compra el producto indicado en ${empresaNombre} — cada unidad cuenta para tu progreso.`;
    case "puntos_acumulados":
      return `Cada visita o compra en ${empresaNombre} te da puntos que suman para este reto.`;
    default:
      return `Sigue interactuando con ${empresaNombre} para avanzar en este reto.`;
  }
}
