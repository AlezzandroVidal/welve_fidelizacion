import { z } from "zod";

export const cuponFormSchema = z.object({
  nombre:                  z.string().min(3, "Mínimo 3 caracteres"),
  codigo:                  z.string().optional(),
  tipo:                    z.string(),
  valor:                   z.string().optional(),
  cantidad_paga:           z.string().optional(),
  cantidad_lleva:          z.string().optional(),
  monto_minimo:            z.string().optional(),
  fecha_inicio:            z.string().min(1, "Requerido"),
  fecha_expiracion:        z.string().min(1, "Requerido"),
  limite_usos_total:       z.string().optional(),
  limite_usos_por_cliente: z.string().optional(),
  sin_limite:              z.boolean().optional(),
  visibilidad:             z.string(),
  reto_id:                 z.string().optional(),
  requisito_tipo:          z.string().optional(),
  requisito_valor:         z.string().optional(),
  requisito_periodo_dias:  z.string().optional(),
  requisito_categoria_objetivo: z.string().optional(),
  notificar_al_desbloquear:z.boolean().optional(),
  mensaje_notificacion:    z.string().optional(),
  destacado:               z.boolean().optional(),
  terminos_condiciones:    z.string().optional(),
  descripcion_larga:       z.string().max(500, "Máximo 500 caracteres").optional(),
  instrucciones_canje:     z.string().optional(),
  monto_minimo_carrito:    z.string().optional(),
}).superRefine((d, ctx) => {
  if (d.tipo === "porcentual" || d.tipo === "monto_fijo") {
    if (!d.valor || !parseFloat(d.valor)) {
      ctx.addIssue({ code: "custom", message: "Requerido para este tipo", path: ["valor"] });
    }
  }
  if (d.tipo === "porcentual" && d.valor) {
    const n = parseFloat(d.valor);
    if (n < 1 || n > 100) ctx.addIssue({ code: "custom", message: "Entre 1 y 100", path: ["valor"] });
  }
  if (d.tipo === "n_por_m") {
    const paga = parseInt(d.cantidad_paga || "0"), lleva = parseInt(d.cantidad_lleva || "0");
    if (!paga || !lleva) ctx.addIssue({ code: "custom", message: "Requerido para NxM", path: ["cantidad_paga"] });
    else if (paga >= lleva) ctx.addIssue({ code: "custom", message: "Debe ser menor que 'lleva'", path: ["cantidad_paga"] });
  }
  if (d.fecha_inicio && d.fecha_expiracion && d.fecha_expiracion <= d.fecha_inicio) {
    ctx.addIssue({ code: "custom", message: "Debe ser posterior a la fecha inicio", path: ["fecha_expiracion"] });
  }
  // visibilidad=por_reto NO exige reto_id acá — un cupón puede crearse "a la
  // espera" de que se le asigne un reto desde RetoModal (pestaña "Cupones
  // que desbloquea"), el flujo principal cuando el reto todavía no existe.
  if (d.visibilidad === "por_requisito") {
    if (!d.requisito_tipo) ctx.addIssue({ code: "custom", message: "Selecciona un tipo", path: ["requisito_tipo"] });
    if (!d.requisito_valor || !parseFloat(d.requisito_valor)) {
      ctx.addIssue({ code: "custom", message: "Requerido", path: ["requisito_valor"] });
    }
  }
});

export type CuponFormData = z.infer<typeof cuponFormSchema>;

export const TABS_CUPON = [
  { id: "basico",      label: "Básico" },
  { id: "descuento",   label: "Descuento" },
  { id: "productos",   label: "Productos válidos" },
  { id: "visibilidad", label: "Visibilidad y acceso" },
  { id: "vigencia",    label: "Vigencia y límites" },
] as const;
export type TabIdCupon = typeof TABS_CUPON[number]["id"];

export const CAMPOS_POR_TAB: Record<TabIdCupon, string[]> = {
  basico:      ["nombre", "codigo", "descripcion_larga"],
  descuento:   ["valor", "cantidad_paga", "cantidad_lleva", "monto_minimo"],
  productos:   ["monto_minimo_carrito"],
  visibilidad: ["reto_id", "requisito_tipo", "requisito_valor", "requisito_periodo_dias", "requisito_categoria_objetivo"],
  vigencia:    ["fecha_inicio", "fecha_expiracion", "limite_usos_total", "limite_usos_por_cliente"],
};
