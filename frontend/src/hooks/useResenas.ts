import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resenasApi, DejarResenaDto } from "../api/resenas";

export function useResenasDeEmpresa(empresaId: string | null) {
  return useQuery({
    queryKey: ["resenas", "empresa", empresaId ?? ""],
    queryFn: () => resenasApi.deEmpresa(empresaId!).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useMiResena(empresaId: string | null) {
  return useQuery({
    queryKey: ["resenas", "mia", empresaId ?? ""],
    queryFn: () => resenasApi.mia(empresaId!).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useDejarResena(empresaId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DejarResenaDto) => resenasApi.dejar(empresaId!, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resenas", "empresa", empresaId ?? ""] });
      qc.invalidateQueries({ queryKey: ["resenas", "mia", empresaId ?? ""] });
    },
  });
}

export function useMisResenasEmpresa() {
  return useQuery({
    queryKey: ["resenas", "me"],
    queryFn: () => resenasApi.mias().then((r) => r.data),
  });
}
