import api from "./client";

export interface Cliente {
  id: string;
  nombre: string;
  codigoCliente: string;
  email?: string;
  whatsapp?: string;
  fechaAlta: string;
  visitasTotales: number;
  montoAcumulado: number;
  rachaActual: number;
  puntos: number;
  segmento: string;
  ultimaVisita: string | null;
}

export const clientesApi = {
  list: () => api.get<Cliente[]>("/clientes"),
  get: (id: string) => api.get<Cliente>(`/clientes/${id}`),
  /** Cupones vigentes de la empresa con el AccesoCupon de este cliente
   * embebido (shape snake_case, mismo criterio que los endpoints de
   * wallet_service — ver acceso.estado/puede_canjear/desbloqueado_en). */
  cupones: (id: string) => api.get<Record<string, unknown>[]>(`/clientes/${id}/cupones`),
};
