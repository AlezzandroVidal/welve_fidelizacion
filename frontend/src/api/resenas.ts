import api from "./client";

export interface Resena {
  id: string;
  empresaId: string;
  clienteId: string;
  clienteNombre: string;
  clienteFotoUrl: string | null;
  estrellas: number;
  comentario: string | null;
  fecha: string;
}

export interface ResenaResumen {
  promedio: number;
  total: number;
  distribucion: Record<string, number>;
}

export interface ResenasEmpresa {
  resumen: ResenaResumen;
  resenas: Resena[];
}

export interface DejarResenaDto {
  estrellas: number;
  comentario?: string | null;
}

export const resenasApi = {
  deEmpresa: (empresaId: string) => api.get<ResenasEmpresa>(`/resenas/empresa/${empresaId}`),
  mia: (empresaId: string) => api.get<Resena | null>(`/resenas/empresa/${empresaId}/mia`),
  dejar: (empresaId: string, data: DejarResenaDto) => api.post<Resena>(`/resenas/empresa/${empresaId}`, data),
  mias: () => api.get<ResenasEmpresa>("/resenas/me"),
};
