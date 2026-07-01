import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { retosApi, CreateRetoDto, UpdateRetoDto } from "../api/retos";

export function useRetos() {
  return useQuery({
    queryKey: ["retos", "list"],
    queryFn: () => retosApi.list().then((r) => r.data),
  });
}

export function useCreateReto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRetoDto) => retosApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retos", "list"] }),
  });
}

export function useUpdateReto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRetoDto }) => retosApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retos", "list"] }),
  });
}

export function useCancelarReto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retosApi.cancelar(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retos", "list"] }),
  });
}

export function useReactivarReto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retosApi.reactivar(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retos", "list"] }),
  });
}
