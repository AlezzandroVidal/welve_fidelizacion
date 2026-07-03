import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { walletApi } from "../api/wallet";

const KEY = ["wallet", "notificaciones"];

/** Polling cada 30s — no hay WebSocket/SSE en el proyecto, el badge de la
 * campana se refresca por intervalo (ver WalletLayout.tsx). */
export function useNotificaciones() {
  return useQuery({
    queryKey: KEY,
    queryFn: walletApi.getNotificaciones,
    refetchInterval: 30_000,
  });
}

export function useMarcarNotificacionLeida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletApi.marcarNotificacionLeida(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarcarTodasNotificacionesLeidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => walletApi.marcarTodasNotificacionesLeidas(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
