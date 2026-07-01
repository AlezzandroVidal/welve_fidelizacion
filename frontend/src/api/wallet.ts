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

export const walletApi = {
  getEmpresas: () => api.get('/wallet/empresas').then((res: any) => res.data.empresas),
  getEmpresaDetalle: (id: string) => api.get(`/wallet/empresas/${id}`).then((res: any) => res.data),
  getMisCupones: () => api.get('/wallet/mis-cupones').then((res: any) => res.data),
  getHistorial: (page: number = 1, limit: number = 20) => api.get(`/wallet/historial`, { params: { page, limit } }).then((res: any) => res.data),
  getPerfil: () => api.get<Perfil>('/wallet/perfil').then((res) => res.data),
  getMiQR: (empresaId: string) => api.get<MiQR>(`/wallet/mi-qr/${empresaId}`).then((res) => res.data),
  updatePerfil: (data: PerfilUpdateDto) => api.patch<Perfil>('/wallet/perfil', data).then((res) => res.data),
  cambiarPassword: (passwordActual: string | null, passwordNueva: string) =>
    api.post<Perfil>('/wallet/perfil/password', { password_actual: passwordActual, password_nueva: passwordNueva }).then((res) => res.data),
  uploadFoto: (dataUri: string) => api.post<Perfil>('/wallet/perfil/foto', { data_uri: dataUri }).then((res) => res.data),
  deleteFoto: () => api.delete<Perfil>('/wallet/perfil/foto').then((res) => res.data),
};
