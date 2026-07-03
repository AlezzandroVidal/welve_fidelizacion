import type { AccesoVisibilidad, AplicaCupon, TipoRequisito } from "../../../api/cupones";
import type { CuponFormData } from "./cuponFormSchema";

function toIso(date: string, eod = false) { return eod ? `${date}T23:59:59` : `${date}T00:00:00`; }

interface ContextoExtra {
  imagen: string | null;
  tags: string[];
  colorTema: string | null;
  aplicaA: AplicaCupon;
  productosValidos: string[];
  categoriasValidas: string[];
  productoGratisId: string;
  requisitoProductoObjetivoId: string;
}

/** Campos compartidos por CreateCuponDto y UpdateCuponDto — se arma una sola
 * vez para no duplicar el mapeo form -> DTO entre los dos branches de
 * onSubmit en CuponModal.tsx. */
export function buildCamposComunes(d: CuponFormData, ctx: ContextoExtra) {
  const requisito = d.visibilidad === "por_requisito" && d.requisito_tipo
    ? {
        tipo: d.requisito_tipo as TipoRequisito,
        valor: parseFloat(d.requisito_valor || "0"),
        periodo_dias: d.requisito_periodo_dias ? parseInt(d.requisito_periodo_dias) : null,
        producto_objetivo_id: d.requisito_tipo === "gasto_en_productos" ? (ctx.requisitoProductoObjetivoId || null) : null,
        categoria_objetivo: d.requisito_tipo === "gasto_en_productos" ? (d.requisito_categoria_objetivo?.trim() || null) : null,
      }
    : null;

  return {
    monto_minimo:            d.monto_minimo ? parseFloat(d.monto_minimo) : null,
    fecha_expiracion:        toIso(d.fecha_expiracion, true),
    limite_usos_total:       d.sin_limite ? null : d.limite_usos_total ? parseInt(d.limite_usos_total) : null,
    limite_usos_por_cliente: d.limite_usos_por_cliente ? parseInt(d.limite_usos_por_cliente) : 1,
    producto_gratis_id:      ctx.productoGratisId || null,
    visibilidad:             d.visibilidad as AccesoVisibilidad,
    reto_id:                 d.visibilidad === "por_reto" ? d.reto_id || null : null,
    requisito,
    notificar_al_desbloquear:d.notificar_al_desbloquear ?? true,
    mensaje_notificacion:    d.mensaje_notificacion?.trim() || null,
    destacado:               d.destacado ?? false,
    imagen_url:              ctx.imagen,
    terminos_condiciones:    d.terminos_condiciones?.trim() || null,
    descripcion_larga:       d.descripcion_larga?.trim() || null,
    instrucciones_canje:     d.instrucciones_canje?.trim() || null,
    tags:                    ctx.tags,
    color_tema:              ctx.colorTema,
    aplica_a:                ctx.aplicaA,
    productos_validos:       ctx.aplicaA === "productos_especificos" ? ctx.productosValidos : [],
    categorias_validas:      ctx.aplicaA === "categoria" ? ctx.categoriasValidas : [],
    monto_minimo_carrito:    d.monto_minimo_carrito ? parseFloat(d.monto_minimo_carrito) : null,
  };
}

export { toIso };
