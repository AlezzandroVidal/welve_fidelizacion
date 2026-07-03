import api from "./client";

export type Rol = "empresa" | "cliente" | "superadmin" | "soporte";

export interface TokenPayload {
  sub: string;
  rol: Rol;
  email?: string;
  empresa_id?: string;
  exp: number;
}

export interface EmpresaLoginRes {
  accessToken: string;
  tokenType: string;
}

export interface MagicLinkRes {
  message: string;
  devToken?: string;
  verifyUrl?: string;
}

export interface VerifyRes {
  accessToken: string;
  clienteId: string;
  empresaId: string;
}

export const authApi = {
  loginEmpresa: (email: string, password: string) =>
    api.post<EmpresaLoginRes>("/empresas/login", { admin_email: email, admin_password: password }),

  registerEmpresa: (data: {
    nombre: string;
    rubro: string;
    admin_nombre: string;
    admin_email: string;
    admin_password: string;
    admin_telefono?: string;
    direccion?: string;
    descripcion?: string;
  }) => api.post("/empresas/register", data),

  // empresa_id ausente = login global al wallet (no atado a una empresa puntual)
  solicitarMagicLink: (email?: string, whatsapp?: string, nombre?: string, empresa_id?: string) =>
    api.post<MagicLinkRes>("/auth/cliente/magic-link", { empresa_id, email, whatsapp, nombre }),

  verificarMagicLink: (token: string) =>
    api.get<VerifyRes>(`/auth/cliente/verify?token=${token}`),

  loginCliente: (email: string, password: string) =>
    api.post<VerifyRes>("/auth/cliente/login", { email, password }),

  registerCliente: (data: {
    nombre: string;
    apellido: string;
    email?: string;
    whatsapp?: string;
    password?: string;
    fecha_nacimiento?: string;
    genero?: string;
  }) => api.post<VerifyRes>("/auth/cliente/register", data),

  loginAdmin: (email: string, password: string) =>
    api.post("/admin/auth/login", { email, password }),
};

export function parseJwt(token: string): TokenPayload | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
