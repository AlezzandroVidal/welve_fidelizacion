import api from "./client";

export type TipoCupon = "descuento_porcentual" | "descuento_fijo" | "producto_gratis" | "dos_por_uno";
export type EstadoCupon = "activo" | "pausado" | "expirado";

export interface Cupon {
  id: string;
  empresaId: string;
  nombre: string;
  tipo: TipoCupon;
  valor: number | null;
  montoMinimo: number | null;
  fechaInicio: string;
  fechaExpiracion: string;
  estado: EstadoCupon;
  limiteUsosTotal: number | null;
  limiteUsosPorCliente: number | null;
  usosActuales: number;
  exclusivo: boolean;
  estaVigente: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CanjeResumen {
  id: string;
  clienteId: string;
  cuponId: string;
  fecha: string;
  canal: string;
  staffRef: string | null;
}

/** Cuerpo de creación — snake_case para coincidir con CuponCreate de Pydantic */
export interface CreateCuponDto {
  nombre: string;
  tipo: TipoCupon;
  valor?: number | null;
  monto_minimo?: number | null;
  fecha_inicio: string;
  fecha_expiracion: string;
  limite_usos_total?: number | null;
  limite_usos_por_cliente?: number | null;
  exclusivo?: boolean;
}

/** Cuerpo de edición — snake_case para CuponUpdate */
export interface UpdateCuponDto {
  nombre?: string;
  monto_minimo?: number | null;
  fecha_expiracion?: string;
  limite_usos_total?: number | null;
  limite_usos_por_cliente?: number | null;
  estado?: EstadoCupon;
  exclusivo?: boolean;
}

export const cuponesApi = {
  list:    (estado?: EstadoCupon) =>
    api.get<Cupon[]>("/cupones", { params: estado ? { estado } : undefined }),
  get:     (id: string) =>
    api.get<Cupon>(`/cupones/${id}`),
  create:  (data: CreateCuponDto) =>
    api.post<Cupon>("/cupones", data),
  update:  (id: string, data: UpdateCuponDto) =>
    api.patch<Cupon>(`/cupones/${id}`, data),
  pausar:  (id: string) =>
    api.patch<Cupon>(`/cupones/${id}/pausar`),
  activar: (id: string) =>
    api.patch<Cupon>(`/cupones/${id}/activar`),
  delete:  (id: string) =>
    api.delete(`/cupones/${id}`),
  canjes:  (cuponId: string, limit = 5) =>
    api.get<CanjeResumen[]>(`/cupones/${cuponId}/canjes`, { params: { limit } }),
};
