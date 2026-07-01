import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi, type PerfilUpdateDto } from '../api/wallet';

export const useEmpresasWallet = () => {
  return useQuery({
    queryKey: ['wallet-empresas'],
    queryFn: walletApi.getEmpresas,
  });
};

export const useEmpresaDetalle = (empresaId: string) => {
  return useQuery({
    queryKey: ['wallet-empresa-detalle', empresaId],
    queryFn: () => walletApi.getEmpresaDetalle(empresaId),
    enabled: !!empresaId,
  });
};

export const useMisCupones = () => {
  return useQuery({
    queryKey: ['wallet-mis-cupones'],
    queryFn: walletApi.getMisCupones,
  });
};

export const useHistorial = (page: number = 1) => {
  return useQuery({
    queryKey: ['wallet-historial', page],
    queryFn: () => walletApi.getHistorial(page),
  });
};

export const usePerfil = () => {
  return useQuery({
    queryKey: ['wallet-perfil'],
    queryFn: walletApi.getPerfil,
  });
};

export const useMiQR = (empresaId: string) => {
  return useQuery({
    queryKey: ['wallet-mi-qr', empresaId],
    queryFn: () => walletApi.getMiQR(empresaId),
    enabled: !!empresaId,
  });
};

export const useUpdatePerfil = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PerfilUpdateDto) => walletApi.updatePerfil(data),
    onSuccess: (data) => qc.setQueryData(['wallet-perfil'], data),
  });
};

export const useCambiarPassword = () => {
  return useMutation({
    mutationFn: ({ passwordActual, passwordNueva }: { passwordActual: string | null; passwordNueva: string }) =>
      walletApi.cambiarPassword(passwordActual, passwordNueva),
  });
};

export const useUploadFoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dataUri: string) => walletApi.uploadFoto(dataUri),
    onSuccess: (data) => qc.setQueryData(['wallet-perfil'], data),
  });
};

export const useDeleteFoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => walletApi.deleteFoto(),
    onSuccess: (data) => qc.setQueryData(['wallet-perfil'], data),
  });
};
