import { useQuery } from "@tanstack/react-query";
import { metricasApi } from "../api/metricas";

export function useResumen() {
  return useQuery({
    queryKey: ["metricas", "resumen"],
    queryFn: () => metricasApi.getResumen().then((r) => r.data),
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useCanjesPorDia(dias: number) {
  return useQuery({
    queryKey: ["metricas", "canjes-por-dia", dias],
    queryFn: () => metricasApi.getCanjesPorDia(dias).then((r) => r.data),
  });
}

export function useTopCupones(limit: number) {
  return useQuery({
    queryKey: ["metricas", "top-cupones", limit],
    queryFn: () => metricasApi.getTopCupones(limit).then((r) => r.data),
  });
}

export function useClientesNuevos(dias: number) {
  return useQuery({
    queryKey: ["metricas", "clientes-nuevos", dias],
    queryFn: () => metricasApi.getClientesNuevos(dias).then((r) => r.data),
  });
}

export function useEmpresa() {
  return useQuery({
    queryKey: ["empresa", "me"],
    queryFn: () => metricasApi.getEmpresa().then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });
}
