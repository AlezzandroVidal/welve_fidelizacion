import api from "./client";

export type FrecuenciaMembresia = "mensual" | "anual";
export type EstadoMembresia = "activa" | "pausada";
export type EstadoMembresiaCliente = "activa" | "vencida" | "cancelada";

export interface Membresia {
  id: string;
  empresaId: string;
  nombre: string;
  precio: number;
  beneficioDescripcion: string;
  frecuencia: FrecuenciaMembresia;
  estado: EstadoMembresia;
}

export interface MembresiaCliente {
  id: string;
  empresaId: string;
  clienteId: string;
  membresiaId: string;
  clienteNombre: string | null;
  estado: EstadoMembresiaCliente;
  fechaInicio: string;
  fechaProximoCobro: string | null;
}

export interface CreateMembresiaDto {
  nombre: string;
  precio: number;
  beneficio_descripcion: string;
  frecuencia: FrecuenciaMembresia;
}

export interface CreateMembresiaClienteDto {
  membresia_id: string;
  cliente_id: string;
  fecha_inicio: string;
  fecha_proximo_cobro?: string | null;
}

export const membresiasApi = {
  listPlanes: () => api.get<Membresia[]>("/membresias"),
  createPlan: (data: CreateMembresiaDto) => api.post<Membresia>("/membresias", data),

  listSuscripciones: (membresiaId?: string) => 
    api.get<MembresiaCliente[]>("/membresias/suscripciones", { params: { membresia_id: membresiaId } }),
  createSuscripcion: (data: CreateMembresiaClienteDto) => 
    api.post<MembresiaCliente>("/membresias/suscripciones", data),
  updateSuscripcion: (mcId: string, estado: EstadoMembresiaCliente) => 
    api.patch<MembresiaCliente>(`/membresias/suscripciones/${mcId}`, { estado }),
};
