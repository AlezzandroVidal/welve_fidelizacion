import api from "./client";
import type { Cupon } from "./cupones";
import type { Producto } from "./productos";
import type { MetodoPagoVenta, Venta } from "./ventas";

export interface ItemCarritoInput {
  producto_id: string;
  cantidad: number;
}

export interface CalcularCarritoDto {
  items: ItemCarritoInput[];
  cupon_id?: string | null;
  cliente_id?: string | null;
}

export interface ProcesarVentaDto {
  items: ItemCarritoInput[];
  cliente_id?: string | null;
  cupon_id?: string | null;
  metodo_pago: MetodoPagoVenta;
  monto_efectivo?: number | null;
  monto_tarjeta?: number | null;
  monto_yape?: number | null;
  notas?: string | null;
}

export interface ItemCarritoCalculado {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface CarritoCalculado {
  items: ItemCarritoCalculado[];
  subtotal: number;
  cuponAplicado: Cupon | null;
  descuentoMonto: number;
  descuentoPorcentaje: number;
  igv: number;
  total: number;
  erroresCupon: string | null;
  esValido: boolean;
}

export const cajaApi = {
  calcular: (data: CalcularCarritoDto) => api.post<CarritoCalculado>("/ventas/calcular", data),
  procesar: (data: ProcesarVentaDto) => api.post<Venta>("/ventas", data),
};
