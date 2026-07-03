import { useMemo } from 'react';
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

export const useCuponesPorEmpresa = (empresaId: string, filtros?: { tag?: string; destacado?: boolean }) => {
  return useQuery({
    queryKey: ['wallet-cupones-empresa', empresaId, filtros],
    queryFn: () => walletApi.getCuponesPorEmpresa(empresaId, filtros),
    enabled: !!empresaId,
  });
};

export const useCuponesDestacados = () => {
  return useQuery({
    queryKey: ['wallet-cupones-destacados'],
    queryFn: walletApi.getCuponesDestacados,
  });
};

/** Público — sin depender de sesión, usado por /wallet/cupon/:id */
export const useCuponDetalle = (cuponId: string) => {
  return useQuery({
    queryKey: ['wallet-cupon-detalle', cuponId],
    queryFn: () => walletApi.getCuponDetalle(cuponId),
    enabled: !!cuponId,
  });
};

/** Filtro en memoria (nombre/tags) sobre empresas + destacados ya cargados —
 * no pega a un endpoint de búsqueda global. */
export const useBusqueda = (query: string, empresas: any[] = [], cuponesDestacados: any[] = []) => {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { empresas: [] as any[], cupones: [] as any[] };
    return {
      empresas: empresas.filter(
        (e: any) => e.nombre?.toLowerCase().includes(q) || e.descripcion?.toLowerCase().includes(q),
      ),
      cupones: cuponesDestacados.filter(
        (c: any) =>
          c.nombre?.toLowerCase().includes(q) ||
          (c.tags || []).some((t: string) => t.toLowerCase().includes(q)),
      ),
    };
  }, [query, empresas, cuponesDestacados]);
};

export const useMisCupones = () => {
  return useQuery({
    queryKey: ['wallet-mis-cupones'],
    queryFn: walletApi.getMisCupones,
  });
};

/** Todos los cupones que el cliente puede ver de TODAS las empresas activas
 * (público/vip/en-progreso/desbloqueados) — sin exigir afiliación previa
 * (Parte 1). Usado por los tabs Disponibles/En progreso de MisCuponesPage. */
export const useCupones = () => {
  return useQuery({
    queryKey: ['wallet-cupones'],
    queryFn: walletApi.getCupones,
  });
};

export const useCuponesDesbloqueados = () => {
  return useQuery({
    queryKey: ['wallet-cupones-desbloqueados'],
    queryFn: walletApi.getCuponesDesbloqueados,
  });
};

export const useDesbloquearCupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cuponId: string) => walletApi.desbloquearCupon(cuponId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-cupones'] });
      qc.invalidateQueries({ queryKey: ['wallet-cupones-desbloqueados'] });
      qc.invalidateQueries({ queryKey: ['wallet', 'mis-retos'] });
    },
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
