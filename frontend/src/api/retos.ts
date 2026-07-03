import api from "./client";

export type TipoReto =
  | "num_visitas"
  | "visitas_en_periodo"
  | "monto_acumulado"
  | "monto_en_periodo"
  | "productos_comprados"
  | "puntos_acumulados"
  | "monto_en_productos";

export interface Reto {
  id: string;
  empresaId: string;
  nombre: string;
  condicionTipo: TipoReto;
  condicionValor: number;
  periodoDias: number | null;
  productoObjetivoId: string | null;
  categoriaObjetivo: string | null;
  fechaInicio: string;
  fechaFin: string;
  recompensaCuponId: string | null;
  recompensaCuponNombre: string | null;
  descripcionRecompensa: string | null;
  mostrarProgresoPublico: boolean;
  notificarAlCompletar: boolean;
  mensajeCompletado: string | null;
  notificado: boolean;
  cancelado: boolean;
}

export interface CreateRetoDto {
  nombre: string;
  condicion_tipo: TipoReto;
  condicion_valor: number;
  periodo_dias?: number | null;
  producto_objetivo_id?: string | null;
  categoria_objetivo?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  recompensa_cupon_id?: string | null;
  descripcion_recompensa?: string | null;
  mostrar_progreso_publico?: boolean;
  notificar_al_completar?: boolean;
  mensaje_completado?: string | null;
}

export interface UpdateRetoDto {
  nombre?: string;
  condicion_valor?: number;
  periodo_dias?: number | null;
  producto_objetivo_id?: string | null;
  categoria_objetivo?: string | null;
  fecha_fin?: string;
  recompensa_cupon_id?: string | null;
  descripcion_recompensa?: string | null;
  mostrar_progreso_publico?: boolean;
  notificar_al_completar?: boolean;
  mensaje_completado?: string | null;
}

export const retosApi = {
  list: () => api.get<Reto[]>("/retos"),
  create: (data: CreateRetoDto) => api.post<Reto>("/retos", data),
  update: (id: string, data: UpdateRetoDto) => api.patch<Reto>(`/retos/${id}`, data),
  cancelar: (id: string) => api.post<Reto>(`/retos/${id}/cancelar`),
  reactivar: (id: string) => api.post<Reto>(`/retos/${id}/reactivar`),
  /** Reemplaza el set completo de cupones visibilidad=por_reto ligados a
   * este reto — un reto puede desbloquear varios cupones a la vez. */
  asignarCupones: (id: string, cuponIds: string[]) =>
    api.put<string[]>(`/retos/${id}/cupones`, { cupon_ids: cuponIds }),
};
