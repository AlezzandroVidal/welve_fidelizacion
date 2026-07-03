import { useQuery } from "@tanstack/react-query";
import { walletApi } from "../api/wallet";

export function useMisRetos() {
  return useQuery({
    queryKey: ["wallet", "mis-retos"],
    queryFn:  () => walletApi.getMisRetos(),
  });
}

/** Deriva los retos de una sola empresa de la misma query de useMisRetos()
 * (comparten caché) en vez de pedirlos de nuevo. */
export function useRetosEmpresa(empresaId: string | null) {
  const { data, ...rest } = useMisRetos();
  const empresaRetos = data?.find((e) => e.empresa.id === empresaId) ?? null;
  return { data: empresaRetos, ...rest };
}
