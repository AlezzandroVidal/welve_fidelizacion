import api from "./client";

export type TipoProducto = "producto" | "servicio";
export type UnidadMedida = "unidad" | "kg" | "litro" | "metro" | "hora" | "sesion";
export type TipoMovimiento = "entrada" | "salida" | "ajuste" | "venta" | "devolucion";
export type EstadoProducto = "activo" | "inactivo" | "agotado";

export interface Producto {
  id: string;
  empresaId: string;
  nombre: string;
  descripcion: string | null;
  descripcionLarga: string | null;
  tipo: TipoProducto;
  categoria: string | null;
  subcategoria: string | null;
  sku: string;
  codigoBarras: string | null;
  codigoQr: string | null;
  precioBase: number;
  precioConIgv: number;
  moneda: string;
  tieneIgv: boolean;
  gestionarInventario: boolean;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number | null;
  unidadMedida: UnidadMedida;
  imagenUrl: string | null;
  imagenesAdicionales: string[];
  estado: EstadoProducto;
  disponibleParaVenta: boolean;
  tags: string[];
  enAlertaStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MovimientoInventario {
  id: string;
  empresaId: string;
  productoId: string;
  productoNombre: string | null;
  productoSku: string | null;
  tipo: TipoMovimiento;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string | null;
  ventaId: string | null;
  createdAt: string;
  createdBy: string;
}

export interface ProductoFiltros {
  estado?: EstadoProducto;
  tipo?: TipoProducto;
  categoria?: string;
  q?: string;
}

export interface CreateProductoDto {
  nombre: string;
  descripcion?: string | null;
  descripcion_larga?: string | null;
  tipo?: TipoProducto;
  categoria?: string | null;
  subcategoria?: string | null;
  sku?: string | null;
  codigo_barras?: string | null;
  codigo_qr?: string | null;
  precio_base: number;
  tiene_igv?: boolean;
  gestionar_inventario?: boolean;
  stock_actual?: number;
  stock_minimo?: number;
  stock_maximo?: number | null;
  unidad_medida?: UnidadMedida;
  imagen_url?: string | null;
  imagenes_adicionales?: string[];
  tags?: string[];
}

export interface UpdateProductoDto {
  nombre?: string;
  descripcion?: string | null;
  descripcion_larga?: string | null;
  categoria?: string | null;
  subcategoria?: string | null;
  sku?: string;
  codigo_barras?: string | null;
  codigo_qr?: string | null;
  precio_base?: number;
  tiene_igv?: boolean;
  gestionar_inventario?: boolean;
  stock_minimo?: number;
  stock_maximo?: number | null;
  unidad_medida?: UnidadMedida;
  imagen_url?: string | null;
  imagenes_adicionales?: string[];
  tags?: string[];
  estado?: EstadoProducto;
  disponible_para_venta?: boolean;
}

export interface ActualizarStockDto {
  cantidad: number;
  tipo: TipoMovimiento;
  motivo?: string | null;
}

export const productosApi = {
  list: (filtros?: ProductoFiltros) => api.get<Producto[]>("/productos", { params: filtros }),
  buscarPorCodigo: (codigo: string) => api.get<Producto>("/productos/buscar", { params: { codigo } }),
  alertasStock: () => api.get<Producto[]>("/productos/alertas-stock"),
  get: (id: string) => api.get<Producto>(`/productos/${id}`),
  create: (data: CreateProductoDto) => api.post<Producto>("/productos", data),
  update: (id: string, data: UpdateProductoDto) => api.patch<Producto>(`/productos/${id}`, data),
  actualizarStock: (id: string, data: ActualizarStockDto) => api.patch<Producto>(`/productos/${id}/stock`, data),
  movimientos: (id: string, limit = 10) =>
    api.get<MovimientoInventario[]>(`/productos/${id}/movimientos`, { params: { limit } }),
  movimientosEmpresa: (filtros?: { producto_id?: string; tipo?: TipoMovimiento; limit?: number }) =>
    api.get<MovimientoInventario[]>("/productos/movimientos/todos", { params: filtros }),
  delete: (id: string) => api.delete(`/productos/${id}`),
};
