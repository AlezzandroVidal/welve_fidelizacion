import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActualizarStockDto, CreateProductoDto, ProductoFiltros, TipoMovimiento, UpdateProductoDto, productosApi,
} from "../api/productos";

const K = {
  list:        (f?: ProductoFiltros) => ["productos", "list", f ?? {}] as const,
  detail:      (id: string)          => ["productos", "detail", id]    as const,
  alertas:     ()                    => ["productos", "alertas"]       as const,
  movimientos: (id: string)          => ["productos", "movimientos", id] as const,
};

export function useProductos(filtros?: ProductoFiltros) {
  return useQuery({
    queryKey: K.list(filtros),
    queryFn:  () => productosApi.list(filtros).then((r) => r.data),
  });
}

export function useProducto(id: string | null) {
  return useQuery({
    queryKey: K.detail(id ?? ""),
    queryFn:  () => productosApi.get(id!).then((r) => r.data),
    enabled:  !!id,
  });
}

export function useBuscarProducto(codigo: string | null) {
  return useQuery({
    queryKey: ["productos", "buscar", codigo ?? ""],
    queryFn:  () => productosApi.buscarPorCodigo(codigo!).then((r) => r.data),
    enabled:  !!codigo,
    retry:    false,
  });
}

export function useAlertasStock() {
  return useQuery({
    queryKey: K.alertas(),
    queryFn:  () => productosApi.alertasStock().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useMovimientosEmpresa(filtros?: { producto_id?: string; tipo?: TipoMovimiento; limit?: number }) {
  return useQuery({
    queryKey: ["productos", "movimientos-empresa", filtros ?? {}],
    queryFn:  () => productosApi.movimientosEmpresa(filtros).then((r) => r.data),
  });
}

export function useMovimientosProducto(id: string | null, limit = 10) {
  return useQuery({
    queryKey: [...K.movimientos(id ?? ""), limit],
    queryFn:  () => productosApi.movimientos(id!, limit).then((r) => r.data),
    enabled:  !!id,
  });
}

function invalidarProductos(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["productos"] });
}

export function useCreateProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductoDto) => productosApi.create(data).then((r) => r.data),
    onSuccess:  () => invalidarProductos(qc),
  });
}

export function useUpdateProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductoDto }) =>
      productosApi.update(id, data).then((r) => r.data),
    onSuccess: () => invalidarProductos(qc),
  });
}

export function useUpdateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ActualizarStockDto }) =>
      productosApi.actualizarStock(id, data).then((r) => r.data),
    onSuccess: () => invalidarProductos(qc),
  });
}

export function useDeleteProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productosApi.delete(id),
    onSuccess:  () => invalidarProductos(qc),
  });
}
