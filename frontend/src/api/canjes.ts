import api from "./client";

export type CanalCanje = "qr" | "magic_link" | "staff_manual" | "automatico";

export interface Canje {
  id: string;
  empresaId: string;
  clienteId: string;
  cuponId: string;
  fecha: string;
  canal: CanalCanje;
  staffRef: string | null;
  clienteNombre: string | null;
  clienteCodigo: string | null;
  cuponNombre: string | null;
  cuponTipo: string | null;
  cuponValor: number | null;
}

export interface CreateCanjeDto {
  cupon_id: string;
  canal: CanalCanje;
  staff_ref?: string | null;
}

export const canjesApi = {
  list: () => api.get<Canje[]>("/canjes"),
  create: (clienteId: string, data: CreateCanjeDto) =>
    api.post<Canje>(`/canjes/${clienteId}`, data),
};
