import { useMutation, useQuery } from "@tanstack/react-query";
import { staffApi } from "../api/staff";

export function useClientePorCodigo(codigoCliente: string | null) {
  return useQuery({
    queryKey: ["staff", "cliente", codigoCliente ?? ""],
    queryFn: () => staffApi.clientePorCodigo(codigoCliente!).then((r) => r.data),
    enabled: !!codigoCliente,
    retry: false,
  });
}

export function useVisitaPorCodigo() {
  return useMutation({
    mutationFn: ({ codigoCliente, monto }: { codigoCliente: string; monto?: number }) =>
      staffApi.visitaPorCodigo(codigoCliente, monto).then((r) => r.data),
  });
}

export function useVisitaPorQR() {
  return useMutation({
    mutationFn: ({ clienteId, monto }: { clienteId: string; monto?: number }) =>
      staffApi.visitaPorQR(clienteId, monto).then((r) => r.data),
  });
}

export function useCanjePorCodigo() {
  return useMutation({
    mutationFn: ({ codigoCliente, cuponId, monto }: { codigoCliente: string; cuponId: string; monto?: number }) =>
      staffApi.canjePorCodigo(codigoCliente, cuponId, monto).then((r) => r.data),
  });
}

export function useCanjePorQR() {
  return useMutation({
    mutationFn: ({ clienteId, cuponId, monto }: { clienteId: string; cuponId: string; monto?: number }) =>
      staffApi.canjePorQR(clienteId, cuponId, monto).then((r) => r.data),
  });
}
