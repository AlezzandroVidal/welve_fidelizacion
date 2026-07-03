import api from './client';

export interface MiQR {
  codigo_cliente: string;
  qr_data: string;
  empresa: { nombre: string; logo_url: string | null };
}

export interface PerfilCliente {
  nombre: string;
  email: string | null;
  whatsapp: string | null;
  foto_url: string | null;
  tiene_password: boolean;
  codigo_cliente: string;
}

export interface PerfilRelacionResumen {
  empresa: { id: string; nombre: string; logo_url: string | null };
  visitas: number;
  puntos: number;
  racha: number;
  segmento: string;
}

export interface Perfil {
  cliente: PerfilCliente;
  resumen: PerfilRelacionResumen[];
  total_canjes: number;
  total_empresas: number;
  total_puntos_global: number;
  racha_maxima_global: number;
}

export interface PerfilUpdateDto {
  nombre?: string;
  email?: string;
  whatsapp?: string;
}

export interface CuponResumen {
  id: string;
  empresaId: string;
  nombre: string;
  tipo: string;
  valor: number | null;
  montoMinimo: number | null;
  fechaInicio: string;
  fechaExpiracion: string;
  estado: string;
  limiteUsosTotal: number | null;
  limiteUsosPorCliente: number | null;
  usosActuales: number;
  visibilidad: "publico" | "vip" | "por_reto" | "por_requisito" | "privado";
  destacado: boolean;
  imagenUrl: string | null;
  terminosCondiciones: string | null;
  descripcionLarga: string | null;
  instruccionesCanje: string | null;
  tags: string[];
  colorTema: string | null;
  estaVigente: boolean;
}

export interface EmpresaResumenCupon {
  id: string;
  nombre: string;
  rubro: string;
  logoUrl: string | null;
  descripcion: string | null;
  direccion: string | null;
  horario: string | null;
  telefonoContacto: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  sitioWeb: string | null;
}

export type EstadoAcceso = "disponible" | "bloqueado" | "en_progreso" | "desbloqueado_pendiente";

export interface AccesoCupon {
  puede_ver: boolean;
  puede_canjear: boolean;
  estado: EstadoAcceso;
  progreso_actual: number;
  progreso_meta: number;
  progreso_porcentaje: number;
  mensaje: string;
  desbloqueado_en: string | null;
}

export interface CuponDetalle extends CuponResumen {
  empresa: EmpresaResumenCupon;
  cuponesRelacionados: CuponResumen[];
  estaDisponibleParaMi: boolean;
  estaAfiliado: boolean;
  accesoEstado: EstadoAcceso;
  progresoActual: number;
  progresoMeta: number;
  progresoPorcentaje: number;
  accesoMensaje: string;
  desbloqueadoEn: string | null;
}

export interface EmpresaConCupones {
  empresa: { id: string; nombre: string; logo_url: string | null };
  cupones: Record<string, unknown>[];
}

export interface Notificacion {
  id: string;
  clienteId: string;
  empresaId: string;
  tipo: "cupon_desbloqueado" | "reto_completado" | "racha_en_riesgo" | "nuevo_cupon";
  titulo: string;
  mensaje: string;
  datos: Record<string, string>;
  leida: boolean;
  createdAt: string;
}

export interface RetoInfo {
  id: string;
  empresaId: string;
  nombre: string;
  condicionTipo: string;
  condicionValor: number;
  periodoDias: number | null;
  productoObjetivoId: string | null;
  categoriaObjetivo: string | null;
  fechaInicio: string;
  fechaFin: string;
  recompensaCuponId: string | null;
  recompensaCuponNombre: string | null;
  descripcionRecompensa: string | null;
  notificado: boolean;
  cancelado: boolean;
}

export interface RetoConProgreso {
  reto: RetoInfo;
  progreso_actual: number;
  meta: number;
  porcentaje: number;
  completado: boolean;
  cupon_recompensa: CuponResumen | null;
  dias_restantes: number;
}

export interface EmpresaConRetos {
  empresa: { id: string; nombre: string; logo_url: string | null };
  retos: RetoConProgreso[];
}

export const walletApi = {
  getEmpresas: () => api.get('/wallet/empresas').then((res: any) => res.data.empresas),
  getEmpresaDetalle: (id: string) => api.get(`/wallet/empresas/${id}`).then((res: any) => res.data),
  getCuponesPorEmpresa: (empresaId: string, params?: { tag?: string; destacado?: boolean }) =>
    api.get(`/wallet/empresas/${empresaId}/cupones`, { params }).then((res: any) => res.data.cupones),
  getCuponesDestacados: () => api.get('/wallet/cupones/destacados').then((res: any) => res.data.cupones),
  getCuponDetalle: (cuponId: string) =>
    api.get<CuponDetalle>(`/wallet/cupones/${cuponId}/detalle`).then((res) => res.data),
  getMisCupones: () => api.get('/wallet/mis-cupones').then((res: any) => res.data),
  getCupones: () => api.get<Record<string, EmpresaConCupones>>('/wallet/cupones').then((res) => res.data),
  getCuponesDesbloqueados: () => api.get<Record<string, unknown>[]>('/wallet/cupones/desbloqueados').then((res) => res.data),
  desbloquearCupon: (cuponId: string) =>
    api.post<{ cupon_id: string; desbloqueado_en: string }>(`/wallet/cupones/${cuponId}/desbloquear`).then((res) => res.data),
  getNotificaciones: () => api.get<Notificacion[]>('/wallet/notificaciones').then((res) => res.data),
  marcarNotificacionLeida: (id: string) => api.post(`/wallet/notificaciones/${id}/leer`),
  marcarTodasNotificacionesLeidas: () => api.post<{ marcadas: number }>('/wallet/notificaciones/leer-todas').then((res) => res.data),
  getMisRetos: () => api.get<EmpresaConRetos[]>('/wallet/mis-retos').then((res) => res.data),
  getHistorial: (page: number = 1, limit: number = 20) => api.get(`/wallet/historial`, { params: { page, limit } }).then((res: any) => res.data),
  getPerfil: () => api.get<Perfil>('/wallet/perfil').then((res) => res.data),
  getMiQR: (empresaId: string) => api.get<MiQR>(`/wallet/mi-qr/${empresaId}`).then((res) => res.data),
  updatePerfil: (data: PerfilUpdateDto) => api.patch<Perfil>('/wallet/perfil', data).then((res) => res.data),
  cambiarPassword: (passwordActual: string | null, passwordNueva: string) =>
    api.post<Perfil>('/wallet/perfil/password', { password_actual: passwordActual, password_nueva: passwordNueva }).then((res) => res.data),
  uploadFoto: (dataUri: string) => api.post<Perfil>('/wallet/perfil/foto', { data_uri: dataUri }).then((res) => res.data),
  deleteFoto: () => api.delete<Perfil>('/wallet/perfil/foto').then((res) => res.data),
};
