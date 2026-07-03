import api from "./client";

export type PlanSuscripcion = "starter" | "growth" | "pro";
export type MetodoPago = "tarjeta" | "yape" | "plin" | "transferencia";
export type EstadoPago = "pendiente" | "procesando" | "aprobado" | "rechazado" | "reembolsado";

export interface Pago {
  id: string;
  empresaId: string;
  monto: number;
  moneda: string;
  plan: PlanSuscripcion;
  concepto: string;
  estado: EstadoPago;
  metodoPago: MetodoPago;
  ultimos4: string | null;
  marcaTarjeta: string | null;
  nombreTitular: string | null;
  referencia: string;
  fechaPago: string | null;
  fechaVencimientoPlan: string | null;
  motivoRechazo: string | null;
  createdAt: string;
}

export interface TarjetaInput {
  ultimos_4: string;
  marca_tarjeta: string;
  nombre_titular: string;
  mes_expiracion: string;
  anio_expiracion: string;
}

export interface IniciarPagoDto {
  plan: PlanSuscripcion;
  metodo_pago: MetodoPago;
  tarjeta?: TarjetaInput;
  numero_telefono?: string;
  numero_operacion?: string;
}

export const pagosApi = {
  historial: () => api.get<Pago[]>("/pagos/historial"),
  obtener: (id: string) => api.get<Pago>(`/pagos/${id}`),
  iniciar: (data: IniciarPagoDto) => api.post<Pago>("/pagos/iniciar", data),
  confirmar: (id: string) => api.post<Pago>(`/pagos/${id}/confirmar`),
};
