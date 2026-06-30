import api from "./client";

export interface Resumen {
  total_clientes: number;
  canjes_hoy: number;
  canjes_semana: number;
  canjes_mes: number;
  cupones_activos: number;
  tasa_redencion: number;
  clientes_recurrentes: number;
  racha_promedio: number;
}

export interface PuntoTiempo {
  fecha: string;   // YYYY-MM-DD
  cantidad: number;
}

export interface TopCupon {
  cupon_id: string;
  nombre: string;
  tipo: string;
  usos_actuales: number;
}

export interface EmpresaInfo {
  id: string;
  nombre: string;
  adminEmail: string;
  planSuscripcion: string;
  estado: string;
  rachaDiasRuptura: number;
}

export const metricasApi = {
  getResumen: () => api.get<Resumen>("/metricas/resumen"),
  getCanjesPorDia: (dias: number) => api.get<PuntoTiempo[]>(`/metricas/canjes-por-dia?dias=${dias}`),
  getTopCupones: (limit: number) => api.get<TopCupon[]>(`/metricas/top-cupones?limit=${limit}`),
  getClientesNuevos: (dias: number) => api.get<PuntoTiempo[]>(`/metricas/clientes-nuevos?dias=${dias}`),
  getEmpresa: () => api.get<EmpresaInfo>("/empresas/me"),
};
