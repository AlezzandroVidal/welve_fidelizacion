import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membresiasApi, CreateMembresiaDto, CreateMembresiaClienteDto, EstadoMembresiaCliente, UpdateMembresiaDto } from "../api/membresias";

export function useMembresias() {
  return useQuery({
    queryKey: ["membresias"],
    queryFn: () => membresiasApi.listPlanes().then((r) => r.data),
  });
}

export function useCreateMembresia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMembresiaDto) => membresiasApi.createPlan(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membresias"] }),
  });
}

export function useUpdateMembresia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMembresiaDto }) => membresiasApi.updatePlan(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membresias"] }),
  });
}

export function usePausarMembresia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membresiasApi.pausarPlan(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membresias"] }),
  });
}

export function useActivarMembresia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membresiasApi.activarPlan(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membresias"] }),
  });
}

export function useDeleteMembresia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membresiasApi.deletePlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membresias"] }),
  });
}

export function useSuscripciones(membresiaId?: string) {
  return useQuery({
    queryKey: ["suscripciones", membresiaId],
    queryFn: () => membresiasApi.listSuscripciones(membresiaId).then((r) => r.data),
  });
}

export function useCreateSuscripcion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMembresiaClienteDto) => membresiasApi.createSuscripcion(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suscripciones"] }),
  });
}

export function useUpdateSuscripcion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoMembresiaCliente }) => 
      membresiasApi.updateSuscripcion(id, estado).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suscripciones"] }),
  });
}
