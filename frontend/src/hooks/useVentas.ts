import { useQuery } from "@tanstack/react-query";
import { HistorialVentasFiltros, ventasApi } from "../api/ventas";

export function useVentas(filtros?: HistorialVentasFiltros) {
  return useQuery({
    queryKey: ["ventas", "list", filtros ?? {}],
    queryFn:  () => ventasApi.list(filtros).then((r) => r.data),
  });
}

export function useVenta(id: string | null) {
  return useQuery({
    queryKey: ["ventas", "detail", id ?? ""],
    queryFn:  () => ventasApi.get(id!).then((r) => r.data),
    enabled:  !!id,
  });
}

export function useResumenVentas() {
  return useQuery({
    queryKey: ["ventas", "resumen"],
    queryFn:  () => ventasApi.resumen().then((r) => r.data),
    staleTime: 30_000,
  });
}
