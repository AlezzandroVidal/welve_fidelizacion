import { useQuery } from "@tanstack/react-query";
import { clientesApi } from "../api/clientes";

export function useClientes() {
  return useQuery({
    queryKey: ["clientes", "list"],
    queryFn: () => clientesApi.list().then((r) => r.data),
  });
}
