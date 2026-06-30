import api from './client';

export const walletApi = {
  getEmpresas: () => api.get('/wallet/empresas').then((res: any) => res.data.empresas),
  getEmpresaDetalle: (id: string) => api.get(`/wallet/empresas/${id}`).then((res: any) => res.data),
  getMisCupones: () => api.get('/wallet/mis-cupones').then((res: any) => res.data),
  getHistorial: (page: number = 1, limit: number = 20) => api.get(`/wallet/historial`, { params: { page, limit } }).then((res: any) => res.data),
  getPerfil: () => api.get('/wallet/perfil').then((res: any) => res.data),
};
