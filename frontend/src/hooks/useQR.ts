import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateRecompensaAutomaticaDto, UpdateRecompensaAutomaticaDto, qrApi } from "../api/qr";

export function useEmpresaInfoQR(empresaId: string | null) {
  return useQuery({
    queryKey: ["qr", "empresa-info", empresaId ?? ""],
    queryFn: () => qrApi.infoEmpresa(empresaId!).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useRegistroQR() {
  return useMutation({
    mutationFn: ({ empresaId, data }: {
      empresaId: string;
      data: { nombre: string; email?: string; whatsapp?: string };
    }) => qrApi.registro(empresaId, data).then((r) => r.data),
  });
}

export function useVisitaQR() {
  return useMutation({
    mutationFn: (empresaId: string) => qrApi.visita(empresaId).then((r) => r.data),
  });
}

export function useValidarCupon() {
  return useMutation({
    mutationFn: ({ cuponId, clienteId }: { cuponId: string; clienteId: string }) =>
      qrApi.validarCupon(cuponId, clienteId).then((r) => r.data),
  });
}

export function useRecompensasAutomaticas() {
  return useQuery({
    queryKey: ["recompensas-automaticas"],
    queryFn: () => qrApi.recompensasAutomaticas.list().then((r) => r.data),
  });
}

export function useCrearRecompensaAutomatica() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecompensaAutomaticaDto) =>
      qrApi.recompensasAutomaticas.create(data).then((r) => r.data),
    onSuccess: (data) => qc.setQueryData(["recompensas-automaticas"], data),
  });
}

export function useEditarRecompensaAutomatica() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ index, data }: { index: number; data: UpdateRecompensaAutomaticaDto }) =>
      qrApi.recompensasAutomaticas.update(index, data).then((r) => r.data),
    onSuccess: (data) => qc.setQueryData(["recompensas-automaticas"], data),
  });
}

export function useEliminarRecompensaAutomatica() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (index: number) => qrApi.recompensasAutomaticas.remove(index).then((r) => r.data),
    onSuccess: (data) => qc.setQueryData(["recompensas-automaticas"], data),
  });
}
