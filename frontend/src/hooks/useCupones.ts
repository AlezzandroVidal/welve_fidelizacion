import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateCuponDto, EstadoCupon, UpdateCuponDto, cuponesApi } from "../api/cupones";

const K = {
  list:   (estado?: EstadoCupon) => ["cupones", "list", estado ?? "all"] as const,
  detail: (id: string)           => ["cupones", "detail", id]            as const,
  canjes: (id: string)           => ["cupones", "canjes", id]            as const,
};

export function useCupones(filtroEstado?: EstadoCupon) {
  return useQuery({
    queryKey: K.list(filtroEstado),
    queryFn:  () => cuponesApi.list(filtroEstado).then((r) => r.data),
  });
}

export function useCupon(id: string | null) {
  return useQuery({
    queryKey: K.detail(id ?? ""),
    queryFn:  () => cuponesApi.get(id!).then((r) => r.data),
    enabled:  !!id,
  });
}

export function useCanjesCupon(cuponId: string | null) {
  return useQuery({
    queryKey: K.canjes(cuponId ?? ""),
    queryFn:  () => cuponesApi.canjes(cuponId!).then((r) => r.data),
    enabled:  !!cuponId,
  });
}

export function useCreateCupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCuponDto) => cuponesApi.create(data).then((r) => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["cupones", "list"] }),
  });
}

export function useUpdateCupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCuponDto }) =>
      cuponesApi.update(id, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["cupones", "list"] });
      qc.invalidateQueries({ queryKey: K.detail(id) });
    },
  });
}

export function usePausarCupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cuponesApi.pausar(id).then((r) => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["cupones"] }),
  });
}

export function useActivarCupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cuponesApi.activar(id).then((r) => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["cupones"] }),
  });
}

export function useDeleteCupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cuponesApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["cupones", "list"] }),
  });
}
