import api from "./client";

export interface Empresa {
  id: string;
  nombre: string;
  rubro: string;
  logoUrl: string | null;
  telefonoContacto: string | null;
  adminEmail: string;
  planSuscripcion: string;
  estado: string;
  rachaDiasRuptura: number;
  solesPorPunto: number;
  expiracionMeses: number;
}

export interface EmpresaUpdateDto {
  nombre?: string;
  telefono_contacto?: string;
  racha_dias_ruptura?: number;
  soles_por_punto?: number;
  expiracion_meses?: number;
  logo_url?: string;
}

export const empresaApi = {
  getMe: () => api.get<Empresa>("/empresas/me"),
  updateConfig: (data: EmpresaUpdateDto) => api.patch<Empresa>("/empresas/me/config", data),
  uploadLogo: (dataUri: string) =>
    api.post<Empresa>("/empresas/me/logo", { data_uri: dataUri }),
  deleteLogo: () => api.delete<Empresa>("/empresas/me/logo"),
};
