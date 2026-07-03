import { useQuery } from "@tanstack/react-query";
import { clientesApi } from "../api/clientes";

export function useClientes() {
  return useQuery({
    queryKey: ["clientes", "list"],
    queryFn: () => clientesApi.list().then((r) => r.data),
  });
}

export function useCliente(id: string | null) {
  return useQuery({
    queryKey: ["clientes", "detail", id ?? ""],
    queryFn: () => clientesApi.get(id!).then((r) => r.data),
    enabled: !!id,
  });
}

export function useClienteCupones(id: string | null) {
  return useQuery({
    queryKey: ["clientes", "cupones", id ?? ""],
    queryFn: () => clientesApi.cupones(id!).then((r) => r.data),
    enabled: !!id,
  });
}
