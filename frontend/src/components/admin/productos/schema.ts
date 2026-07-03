import { z } from "zod";

export const productoSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  tipo: z.enum(["producto", "servicio"]),
  categoria: z.string().optional(),
  subcategoria: z.string().optional(),
  descripcion: z.string().optional(),
  imagen_url: z.string().optional(),
  precio_base: z.string().min(1, "Requerido"),
  tiene_igv: z.boolean().optional(),
  sku: z.string().optional(),
  codigo_barras: z.string().optional(),
  gestionar_inventario: z.boolean().optional(),
  stock_actual: z.string().optional(),
  stock_minimo: z.string().optional(),
  stock_maximo: z.string().optional(),
  unidad_medida: z.string().optional(),
}).superRefine((d, ctx) => {
  const precio = parseFloat(d.precio_base);
  if (!precio || precio <= 0) {
    ctx.addIssue({ code: "custom", message: "Debe ser mayor a 0", path: ["precio_base"] });
  }
  if (d.stock_actual && parseInt(d.stock_actual, 10) < 0) {
    ctx.addIssue({ code: "custom", message: "No puede ser negativo", path: ["stock_actual"] });
  }
  if (d.stock_minimo && parseInt(d.stock_minimo, 10) < 0) {
    ctx.addIssue({ code: "custom", message: "No puede ser negativo", path: ["stock_minimo"] });
  }
});

export type ProductoFormData = z.infer<typeof productoSchema>;
