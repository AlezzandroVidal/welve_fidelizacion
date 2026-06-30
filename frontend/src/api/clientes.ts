import api from "./client";

export interface Cliente {
  id: string;
  nombre: string;
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
};
