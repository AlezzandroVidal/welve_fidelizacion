import api from "./client";

export type TipoCupon =
  | "porcentual"
  | "monto_fijo"
  | "producto_gratis"
  | "dos_por_uno"
  | "n_por_m"
  | "envio_gratis"
  | "personalizado";
export type EstadoCupon = "activo" | "pausado" | "expirado";
export type AplicaCupon = "todo" | "productos_especificos" | "categoria";
export type AccesoVisibilidad = "publico" | "vip" | "por_reto" | "por_requisito" | "privado";
export type TipoRequisito =
  | "visitas_totales" | "visitas_en_periodo" | "gasto_total" | "gasto_en_periodo"
  | "puntos_acumulados" | "gasto_en_productos";

export interface RequisitoAcceso {
  tipo: TipoRequisito;
  valor: number;
  periodo_dias: number | null;
  producto_objetivo_id?: string | null;
  categoria_objetivo?: string | null;
}

export interface Cupon {
  id: string;
  empresaId: string;
  nombre: string;
  codigo: string | null;
  tipo: TipoCupon;
  valor: number | null;
  cantidadPaga: number | null;
  cantidadLleva: number | null;
  productoGratisId: string | null;
  montoMinimo: number | null;
  fechaInicio: string;
  fechaExpiracion: string;
  estado: EstadoCupon;
  limiteUsosTotal: number | null;
  limiteUsosPorCliente: number | null;
  usosActuales: number;
  visibilidad: AccesoVisibilidad;
  retoId: string | null;
  requisito: RequisitoAcceso | null;
  notificarAlDesbloquear: boolean;
  mensajeNotificacion: string | null;
  destacado: boolean;
  imagenUrl: string | null;
  terminosCondiciones: string | null;
  descripcionLarga: string | null;
  instruccionesCanje: string | null;
  tags: string[];
  colorTema: string | null;
  aplicaA: AplicaCupon;
  productosValidos: string[];
  categoriasValidas: string[];
  montoMinimoCarrito: number | null;
  estaVigente: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CanjeResumen {
  id: string;
  clienteId: string;
  cuponId: string;
  fecha: string;
  canal: string;
  staffRef: string | null;
}

/** Cuerpo de creación — snake_case para coincidir con CuponCreate de Pydantic */
export interface CreateCuponDto {
  nombre: string;
  codigo?: string | null;
  tipo: TipoCupon;
  valor?: number | null;
  monto_minimo?: number | null;
  fecha_inicio: string;
  fecha_expiracion: string;
  limite_usos_total?: number | null;
  limite_usos_por_cliente?: number | null;
  cantidad_paga?: number | null;
  cantidad_lleva?: number | null;
  producto_gratis_id?: string | null;
  visibilidad?: AccesoVisibilidad;
  reto_id?: string | null;
  requisito?: RequisitoAcceso | null;
  notificar_al_desbloquear?: boolean;
  mensaje_notificacion?: string | null;
  destacado?: boolean;
  imagen_url?: string | null;
  terminos_condiciones?: string | null;
  descripcion_larga?: string | null;
  instrucciones_canje?: string | null;
  tags?: string[];
  color_tema?: string | null;
  aplica_a?: AplicaCupon;
  productos_validos?: string[];
  categorias_validas?: string[];
  monto_minimo_carrito?: number | null;
}

/** Cuerpo de edición — snake_case para CuponUpdate */
export interface UpdateCuponDto {
  nombre?: string;
  codigo?: string | null;
  monto_minimo?: number | null;
  fecha_expiracion?: string;
  limite_usos_total?: number | null;
  limite_usos_por_cliente?: number | null;
  estado?: EstadoCupon;
  visibilidad?: AccesoVisibilidad;
  reto_id?: string | null;
  requisito?: RequisitoAcceso | null;
  notificar_al_desbloquear?: boolean;
  mensaje_notificacion?: string | null;
  producto_gratis_id?: string | null;
  destacado?: boolean;
  imagen_url?: string | null;
  terminos_condiciones?: string | null;
  descripcion_larga?: string | null;
  instrucciones_canje?: string | null;
  tags?: string[];
  color_tema?: string | null;
  aplica_a?: AplicaCupon;
  productos_validos?: string[];
  categorias_validas?: string[];
  monto_minimo_carrito?: number | null;
}

export const cuponesApi = {
  list:    (estado?: EstadoCupon) =>
    api.get<Cupon[]>("/cupones", { params: estado ? { estado } : undefined }),
  get:     (id: string) =>
    api.get<Cupon>(`/cupones/${id}`),
  buscarPorCodigo: (codigo: string) =>
    api.get<Cupon>("/cupones/buscar", { params: { codigo } }),
  create:  (data: CreateCuponDto) =>
    api.post<Cupon>("/cupones", data),
  update:  (id: string, data: UpdateCuponDto) =>
    api.patch<Cupon>(`/cupones/${id}`, data),
  pausar:  (id: string) =>
    api.patch<Cupon>(`/cupones/${id}/pausar`),
  activar: (id: string) =>
    api.patch<Cupon>(`/cupones/${id}/activar`),
  delete:  (id: string) =>
    api.delete(`/cupones/${id}`),
  canjes:  (cuponId: string, limit = 5) =>
    api.get<CanjeResumen[]>(`/cupones/${cuponId}/canjes`, { params: { limit } }),
  validosParaCarrito: (items: { producto_id: string; cantidad: number }[], clienteId: string) =>
    api.get<Cupon[]>("/cupones/validos-para-carrito", {
      params: { items: JSON.stringify(items), cliente_id: clienteId },
    }),
};
