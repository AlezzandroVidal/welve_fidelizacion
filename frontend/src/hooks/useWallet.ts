import { useQuery } from '@tanstack/react-query';
import { walletApi } from '../api/wallet';

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
