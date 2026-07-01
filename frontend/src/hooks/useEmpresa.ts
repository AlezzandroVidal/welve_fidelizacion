import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { empresaApi, EmpresaUpdateDto } from "../api/empresa";

export function useEmpresaMe() {
  return useQuery({
    queryKey: ["empresa", "me"],
    queryFn: () => empresaApi.getMe().then(r => r.data),
  });
}

export function useUpdateEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EmpresaUpdateDto) => empresaApi.updateConfig(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["empresa", "me"] }),
  });
}

export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dataUri: string) => empresaApi.uploadLogo(dataUri).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["empresa", "me"] }),
  });
}

export function useDeleteLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => empresaApi.deleteLogo().then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["empresa", "me"] }),
  });
}

export function useCambiarPasswordEmpresa() {
  return useMutation({
    mutationFn: ({ passwordActual, passwordNueva }: { passwordActual: string; passwordNueva: string }) =>
      empresaApi.cambiarPassword(passwordActual, passwordNueva).then(r => r.data),
  });
}

export function useDesactivarCuenta() {
  return useMutation({
    mutationFn: (nombreConfirmacion: string) =>
      empresaApi.desactivarCuenta(nombreConfirmacion).then(r => r.data),
  });
}
