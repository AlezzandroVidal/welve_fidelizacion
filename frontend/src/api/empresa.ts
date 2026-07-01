import api from "./client";

export interface Empresa {
  id: string;
  nombre: string;
  rubro: string;
  logoUrl: string | null;
  telefonoContacto: string | null;
  descripcion: string | null;
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  horario: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  adminEmail: string;
  planSuscripcion: string;
  estado: string;
  rachaDiasRuptura: number;
  solesPorPunto: number;
  expiracionMeses: number;
  umbralExclusivoCanjes: number;
  umbralExclusivoDias: number;
  diasGraciaExclusivo: number;
}

export interface EmpresaUpdateDto {
  nombre?: string;
  telefono_contacto?: string;
  racha_dias_ruptura?: number;
  soles_por_punto?: number;
  expiracion_meses?: number;
  logo_url?: string;
  umbral_exclusivo_canjes?: number;
  umbral_exclusivo_dias?: number;
  dias_gracia_exclusivo?: number;
  descripcion?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  horario?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

export const empresaApi = {
  getMe: () => api.get<Empresa>("/empresas/me"),
  updateConfig: (data: EmpresaUpdateDto) => api.patch<Empresa>("/empresas/me/config", data),
  uploadLogo: (dataUri: string) =>
    api.post<Empresa>("/empresas/me/logo", { data_uri: dataUri }),
  deleteLogo: () => api.delete<Empresa>("/empresas/me/logo"),
  cambiarPassword: (passwordActual: string, passwordNueva: string) =>
    api.post<{ mensaje: string }>("/empresas/me/password", { password_actual: passwordActual, password_nueva: passwordNueva }),
  desactivarCuenta: (nombreConfirmacion: string) =>
    api.post<{ mensaje: string }>("/empresas/me/desactivar", { nombre_confirmacion: nombreConfirmacion }),
};
