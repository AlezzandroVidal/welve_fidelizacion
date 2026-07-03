import api from "./client";
import type { ResultadoVisita } from "./qr";
import type { Cupon } from "./cupones";
import type { Canje } from "./canjes";

export interface ClienteInfoStaff {
  id: string;
  nombre: string;
  email: string | null;
  whatsapp: string | null;
  codigoCliente: string;
}

export interface RelacionInfoStaff {
  visitasTotales: number;
  rachaActual: number;
  puntos: number;
  segmento: string;
}

export interface ClienteStaffResponse {
  cliente: ClienteInfoStaff;
  relacion: RelacionInfoStaff;
  cuponesDisponibles: Cupon[];
  canjesRecientes: Canje[];
}

export interface VisitaStaffResponse {
  clienteNombre: string;
  resultado: ResultadoVisita;
}

export interface CanjeStaffResponse {
  clienteNombre: string;
  canje: Canje;
  resultado: ResultadoVisita;
}

export const staffApi = {
  clientePorCodigo: (codigoCliente: string) =>
    api.get<ClienteStaffResponse>(`/staff/cliente/${encodeURIComponent(codigoCliente)}`),

  /** El QR personal del cliente (/wallet/mi-qr) codifica welve://cliente/{id},
   * no su codigo_cliente WLV-XXXX — esta es la variante que reconoce eso. */
  clientePorQR: (clienteId: string) =>
    api.get<ClienteStaffResponse>(`/staff/cliente/por-qr/${encodeURIComponent(clienteId)}`),

  visitaPorCodigo: (codigoCliente: string, monto?: number) =>
    api.post<VisitaStaffResponse>("/staff/visita/por-codigo", { codigo_cliente: codigoCliente, monto }),

  visitaPorQR: (clienteId: string, monto?: number) =>
    api.post<VisitaStaffResponse>("/staff/visita/por-qr", { cliente_id: clienteId, monto }),

  canjePorCodigo: (codigoCliente: string, cuponId: string, monto?: number) =>
    api.post<CanjeStaffResponse>("/staff/canje/por-codigo", { codigo_cliente: codigoCliente, cupon_id: cuponId, monto }),

  canjePorQR: (clienteId: string, cuponId: string, monto?: number) =>
    api.post<CanjeStaffResponse>("/staff/canje/por-qr", { cliente_id: clienteId, cupon_id: cuponId, monto }),
};
