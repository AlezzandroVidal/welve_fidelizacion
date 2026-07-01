import api from "./client";

export interface EmpresaInfoQR {
  id: string;
  nombre: string;
  rubro: string;
  logoUrl: string | null;
  descripcion: string | null;
  totalCuponesActivos: number;
}

export interface RecompensaDesbloqueada {
  cuponId: string;
  nombre: string;
  tipo: string | null;
}

export interface RetoCompletadoQR {
  retoId: string;
  nombre: string;
  recompensa: string | null;
}

export interface ResultadoVisita {
  visitasTotales: number;
  rachaActual: number;
  recompensasDesbloqueadas: RecompensaDesbloqueada[];
  retosCompletados: RetoCompletadoQR[];
  subioAExclusivo: boolean;
  mensaje: string;
  yaRegistradoHoy: boolean;
}

export interface RegistroQRResponse {
  accessToken: string;
  tokenType: string;
  clienteId: string;
  resultado: ResultadoVisita;
}

export interface ValidarCuponResponse {
  canje: {
    id: string;
    empresaId: string;
    clienteId: string;
    cuponId: string;
    fecha: string;
    canal: string;
    staffRef: string | null;
  };
  resultadoVisita: ResultadoVisita;
}

export interface RecompensaAutomatica {
  index: number;
  visitasRequeridas: number;
  cuponId: string;
  cuponNombre: string | null;
  activa: boolean;
  descripcion: string;
}

export interface CreateRecompensaAutomaticaDto {
  visitas_requeridas: number;
  cupon_id: string;
  descripcion: string;
}

export interface UpdateRecompensaAutomaticaDto {
  visitas_requeridas?: number;
  cupon_id?: string;
  descripcion?: string;
  activa?: boolean;
}

export const qrApi = {
  infoEmpresa: (empresaId: string) =>
    api.get<EmpresaInfoQR>(`/qr/empresa/${empresaId}/info`),

  registro: (empresaId: string, data: { nombre: string; email?: string; whatsapp?: string }) =>
    api.post<RegistroQRResponse>(`/qr/empresa/${empresaId}/registro`, data),

  visita: (empresaId: string) =>
    api.post<ResultadoVisita>(`/qr/visita/${empresaId}`),

  validarCupon: (cuponId: string, clienteId: string) =>
    api.post<ValidarCuponResponse>(`/qr/cupon/${cuponId}/validar`, { cliente_id: clienteId }),

  recompensasAutomaticas: {
    list: () => api.get<RecompensaAutomatica[]>("/empresas/me/recompensas-automaticas"),
    create: (data: CreateRecompensaAutomaticaDto) =>
      api.post<RecompensaAutomatica[]>("/empresas/me/recompensas-automaticas", data),
    update: (index: number, data: UpdateRecompensaAutomaticaDto) =>
      api.patch<RecompensaAutomatica[]>(`/empresas/me/recompensas-automaticas/${index}`, data),
    remove: (index: number) =>
      api.delete<RecompensaAutomatica[]>(`/empresas/me/recompensas-automaticas/${index}`),
  },
};
