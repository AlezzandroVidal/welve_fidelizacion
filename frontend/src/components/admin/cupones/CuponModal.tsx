
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import type { Cupon, CreateCuponDto, UpdateCuponDto } from "../../../api/cupones";
import { useCreateCupon, useUpdateCupon } from "../../../hooks/useCupones";
import { Input, SelectField, DateField, Checkbox } from "../../ui";

/* ── Schema ──────────────────────────────────────────────────────────────── */

const schema = z.object({
  nombre:                  z.string().min(3, "Mínimo 3 caracteres"),
  tipo:                    z.string(),
  valor:                   z.string().optional(),
  monto_minimo:            z.string().optional(),
  fecha_inicio:            z.string().min(1, "Requerido"),
  fecha_expiracion:        z.string().min(1, "Requerido"),
  limite_usos_total:       z.string().optional(),
  limite_usos_por_cliente: z.string().optional(),
  exclusivo:               z.boolean().optional(),
}).superRefine((d, ctx) => {
  if (d.tipo === "descuento_porcentual" || d.tipo === "descuento_fijo") {
    if (!d.valor || !parseFloat(d.valor)) {
      ctx.addIssue({ code: "custom", message: "Requerido para este tipo", path: ["valor"] });
    }
  }
  if (d.tipo === "descuento_porcentual" && d.valor) {
    const n = parseFloat(d.valor);
    if (n < 1 || n > 100) ctx.addIssue({ code: "custom", message: "Entre 1 y 100", path: ["valor"] });
  }
  if (d.fecha_inicio && d.fecha_expiracion && d.fecha_expiracion <= d.fecha_inicio) {
    ctx.addIssue({ code: "custom", message: "Debe ser posterior a la fecha inicio", path: ["fecha_expiracion"] });
  }
});

type FormData = z.infer<typeof schema>;

const TIPO_LABELS: Record<string, string> = {
  descuento_porcentual: "Descuento porcentual (%)",
  descuento_fijo:       "Descuento fijo (S/)",
  producto_gratis:      "Producto gratis",
  dos_por_uno:          "2×1",
};

function toIso(date: string, eod = false) { return eod ? `${date}T23:59:59` : `${date}T00:00:00`; }

/* ── Component ───────────────────────────────────────────────────────────── */

interface Props {
  open:     boolean;
  cupon?:   Cupon | null;
  onClose:  () => void;
  onSuccess:(msg: string) => void;
}

export default function CuponModal({ open, cupon, onClose, onSuccess }: Props) {
  const isEdit  = !!cupon;
  const create  = useCreateCupon();
  const update  = useUpdateCupon();
  const pending = create.isPending || update.isPending;

  function toDateStr(iso: string) { return iso.slice(0, 10); }

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: cupon
      ? {
          nombre:                  cupon.nombre,
          tipo:                    cupon.tipo,
          valor:                   cupon.valor?.toString() ?? "",
          monto_minimo:            cupon.montoMinimo?.toString() ?? "",
          fecha_inicio:            toDateStr(cupon.fechaInicio),
          fecha_expiracion:        toDateStr(cupon.fechaExpiracion),
          limite_usos_total:       cupon.limiteUsosTotal?.toString() ?? "",
          limite_usos_por_cliente: cupon.limiteUsosPorCliente?.toString() ?? "1",
          exclusivo:               cupon.exclusivo,
        }
      : { limite_usos_por_cliente: "1", exclusivo: false },
  });

  const tipo       = watch("tipo");
  const needsValor = tipo === "descuento_porcentual" || tipo === "descuento_fijo";

  if (!open) return null;

  async function onSubmit(d: FormData) {
    if (isEdit && cupon) {
      const dto: UpdateCuponDto = {
        nombre:                  d.nombre,
        monto_minimo:            d.monto_minimo ? parseFloat(d.monto_minimo) : null,
        fecha_expiracion:        toIso(d.fecha_expiracion, true),
        limite_usos_total:       d.limite_usos_total ? parseInt(d.limite_usos_total) : null,
        limite_usos_por_cliente: d.limite_usos_por_cliente ? parseInt(d.limite_usos_por_cliente) : 1,
        exclusivo:               d.exclusivo ?? false,
      };
      await update.mutateAsync({ id: cupon.id, data: dto });
      onSuccess("Cupón actualizado");
    } else {
      const dto: CreateCuponDto = {
        nombre:                  d.nombre,
        tipo:                    d.tipo as CreateCuponDto["tipo"],
        valor:                   needsValor && d.valor ? parseFloat(d.valor) : null,
        monto_minimo:            d.monto_minimo ? parseFloat(d.monto_minimo) : null,
        fecha_inicio:            toIso(d.fecha_inicio),
        fecha_expiracion:        toIso(d.fecha_expiracion, true),
        limite_usos_total:       d.limite_usos_total ? parseInt(d.limite_usos_total) : null,
        limite_usos_por_cliente: d.limite_usos_por_cliente ? parseInt(d.limite_usos_por_cliente) : 1,
        exclusivo:               d.exclusivo ?? false,
      };
      await create.mutateAsync(dto);
      onSuccess("Cupón creado");
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative z-10 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl
          animate-fade-up sm:animate-scale-in"
        style={{ maxHeight: "92dvh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? "Editar cupón" : "Nuevo cupón"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <Input
            {...register("nombre")}
            label="Nombre"
            placeholder="Ej. 15% en tu próxima compra"
            error={errors.nombre?.message}
          />

          <SelectField
            {...register("tipo")}
            label="Tipo de cupón"
            error={errors.tipo?.message}
            disabled={isEdit}
          >
            <option value="">Seleccionar...</option>
            {Object.entries(TIPO_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </SelectField>

          {needsValor && (
            <Input
              {...register("valor")}
              type="number"
              step="0.01"
              min="0"
              readOnly={isEdit}
              label={tipo === "descuento_porcentual" ? "Porcentaje (%)" : "Monto (S/)"}
              placeholder={tipo === "descuento_porcentual" ? "Ej. 15" : "Ej. 10"}
              error={errors.valor?.message}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <DateField
              {...register("fecha_inicio")}
              label="Fecha inicio"
              error={errors.fecha_inicio?.message}
              disabled={isEdit}
            />
            <DateField
              {...register("fecha_expiracion")}
              label="Fecha expiración"
              error={errors.fecha_expiracion?.message}
            />
          </div>

          <Input
            {...register("monto_minimo")}
            type="number"
            step="0.01"
            min="0"
            label="Monto mínimo de compra"
            placeholder="Sin mínimo (opcional)"
            error={errors.monto_minimo?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register("limite_usos_total")}
              type="number"
              min="1"
              label="Límite usos totales"
              placeholder="Sin límite"
              error={errors.limite_usos_total?.message}
            />
            <Input
              {...register("limite_usos_por_cliente")}
              type="number"
              min="1"
              label="Límite por cliente"
              error={errors.limite_usos_por_cliente?.message}
            />
          </div>

          <Checkbox
            {...register("exclusivo")}
            label="Solo clientes VIP (exclusivo)"
            description="Visible únicamente para clientes en segmento exclusivo"
          />

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 active:scale-[0.97]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white transition-all hover:bg-welve-600 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cupón"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
