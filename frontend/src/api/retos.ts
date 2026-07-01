import api from "./client";

export type TipoCondicionReto = "num_visitas" | "monto_acumulado";

export interface Reto {
  id: string;
  empresaId: string;
  nombre: string;
  condicionTipo: TipoCondicionReto;
  condicionValor: number;
  fechaInicio: string;
  fechaFin: string;
  recompensaCuponId: string | null;
  recompensaCuponNombre: string | null;
  notificado: boolean;
  cancelado: boolean;
}

export interface CreateRetoDto {
  nombre: string;
  condicion_tipo: TipoCondicionReto;
  condicion_valor: number;
  fecha_inicio: string;
  fecha_fin: string;
  recompensa_cupon_id?: string | null;
}

export interface UpdateRetoDto {
  nombre?: string;
  condicion_valor?: number;
  fecha_fin?: string;
  recompensa_cupon_id?: string | null;
}

export const retosApi = {
  list: () => api.get<Reto[]>("/retos"),
  create: (data: CreateRetoDto) => api.post<Reto>("/retos", data),
  update: (id: string, data: UpdateRetoDto) => api.patch<Reto>(`/retos/${id}`, data),
  cancelar: (id: string) => api.post<Reto>(`/retos/${id}/cancelar`),
  reactivar: (id: string) => api.post<Reto>(`/retos/${id}/reactivar`),
};
