import { z } from "zod";
import type { TipoReto } from "../../../api/retos";

export const CON_PERIODO: TipoReto[] = ["visitas_en_periodo", "monto_en_periodo"];

export const retoFormSchema = z.object({
  nombre:                    z.string().min(3, "Mínimo 3 caracteres"),
  condicion_tipo:            z.string(),
  condicion_valor:           z.string().min(1, "Requerido"),
  periodo_dias:              z.string().optional(),
  categoria_objetivo:        z.string().optional(),
  fecha_inicio:              z.string().min(1, "Requerido"),
  fecha_fin:                 z.string().min(1, "Requerido"),
  recompensa_cupon_id:       z.string().optional(),
  descripcion_recompensa:    z.string().optional(),
  mostrar_progreso_publico:  z.boolean().optional(),
  notificar_al_completar:    z.boolean().optional(),
  mensaje_completado:        z.string().optional(),
}).superRefine((d, ctx) => {
  const val = parseFloat(d.condicion_valor);
  if (isNaN(val) || val <= 0) ctx.addIssue({ code: "custom", message: "Debe ser mayor a 0", path: ["condicion_valor"] });
  if (CON_PERIODO.includes(d.condicion_tipo as TipoReto) && !d.periodo_dias) {
    ctx.addIssue({ code: "custom", message: "Requerido para este tipo", path: ["periodo_dias"] });
  }
  if (d.fecha_inicio && d.fecha_fin && d.fecha_fin <= d.fecha_inicio) {
    ctx.addIssue({ code: "custom", message: "Debe ser posterior al inicio", path: ["fecha_fin"] });
  }
});

export type RetoFormData = z.infer<typeof retoFormSchema>;

export const TABS_RETO = [
  { id: "info",       label: "Información" },
  { id: "condicion",  label: "Condición" },
  { id: "recompensa", label: "Recompensa" },
  { id: "vigencia",   label: "Vigencia" },
] as const;
export type TabIdReto = typeof TABS_RETO[number]["id"];
