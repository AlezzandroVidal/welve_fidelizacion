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
    admin_email: string;
    admin_password: string;
  }) => api.post("/empresas/register", data),

  solicitarMagicLink: (empresa_id: string, email?: string, whatsapp?: string, nombre?: string) =>
    api.post<MagicLinkRes>("/auth/cliente/magic-link", { empresa_id, email, whatsapp, nombre }),

  verificarMagicLink: (token: string) =>
    api.get<VerifyRes>(`/auth/cliente/verify?token=${token}`),
    
  loginCliente: (email: string, password: string) =>
    api.post<VerifyRes>("/auth/cliente/login", { email, password }),
    
  registerCliente: (data: {nombre: string, email: string, password: string, whatsapp?: string}) =>
    api.post<VerifyRes>("/auth/cliente/register", data),

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
