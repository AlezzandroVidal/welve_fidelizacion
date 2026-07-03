import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { canjesApi, CreateCanjeDto } from "../api/canjes";

export function useCanjes() {
  return useQuery({
    queryKey: ["canjes", "list"],
    queryFn: () => canjesApi.list().then((r) => r.data),
  });
}

export function useCanjesCliente(clienteId: string | null) {
  return useQuery({
    queryKey: ["canjes", "cliente", clienteId ?? ""],
    queryFn: () => canjesApi.porCliente(clienteId!).then((r) => r.data),
    enabled: !!clienteId,
  });
}

export function useCreateCanje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clienteId, data }: { clienteId: string; data: CreateCanjeDto }) =>
      canjesApi.create(clienteId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["canjes", "list"] });
      qc.invalidateQueries({ queryKey: ["cupones"] });
    },
  });
}
