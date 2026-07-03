import api from "./client";

export type MetodoPagoVenta = "efectivo" | "tarjeta" | "yape" | "plin" | "mixto";
export type EstadoVenta = "completada" | "cancelada" | "reembolsada";

export interface ItemVenta {
  productoId: string;
  nombreProducto: string;
  sku: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  descuentoItem: number;
}

export interface RecompensaDesbloqueada {
  cuponId: string;
  nombre: string;
  tipo: string | null;
}

export interface RetoCompletado {
  retoId: string;
  nombre: string;
  recompensa: string | null;
}

export interface ResultadoVisita {
  visitasTotales: number;
  rachaActual: number;
  recompensasDesbloqueadas: RecompensaDesbloqueada[];
  retosCompletados: RetoCompletado[];
  subioAExclusivo: boolean;
  mensaje: string;
  yaRegistradoHoy: boolean;
}

export interface Venta {
  id: string;
  empresaId: string;
  clienteId: string | null;
  codigoCliente: string | null;
  clienteNombre: string | null;
  items: ItemVenta[];
  subtotal: number;
  descuentoMonto: number;
  descuentoPorcentaje: number;
  igv: number;
  total: number;
  cuponId: string | null;
  cuponCodigo: string | null;
  canjeId: string | null;
  metodoPago: MetodoPagoVenta;
  montoEfectivo: number | null;
  montoTarjeta: number | null;
  montoYape: number | null;
  vuelto: number | null;
  estado: EstadoVenta;
  notas: string | null;
  createdAt: string;
  createdBy: string;
  resultadoVisita: ResultadoVisita | null;
}

export interface ResumenVentas {
  ventasHoy: number;
  montoHoy: number;
  ventasSemana: number;
  montoSemana: number;
  ventasMes: number;
  montoMes: number;
  ticketPromedioHoy: number;
  metodoMasUsadoHoy: string | null;
  porcentajeConCuponHoy: number;
  productoMasVendidoHoy: string | null;
}

export interface HistorialVentasFiltros {
  fecha_desde?: string;
  fecha_hasta?: string;
  cliente_id?: string;
  con_cupon?: boolean;
  metodo_pago?: MetodoPagoVenta;
}

export const ventasApi = {
  list: (filtros?: HistorialVentasFiltros) => api.get<Venta[]>("/ventas", { params: filtros }),
  resumen: () => api.get<ResumenVentas>("/ventas/resumen"),
  get: (id: string) => api.get<Venta>(`/ventas/${id}`),
};
