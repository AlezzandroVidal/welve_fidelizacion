
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Target } from "lucide-react";
import { useCreateReto } from "../../../hooks/useRetos";
import { useCupones } from "../../../hooks/useCupones";
import { Input, SelectField, DateField } from "../../ui";

/* ── Schema ──────────────────────────────────────────────────────────────── */

const schema = z.object({
  nombre:              z.string().min(3, "Mínimo 3 caracteres"),
  condicion_tipo:      z.enum(["num_visitas", "monto_acumulado"]),
  condicion_valor:     z.string().min(1, "Requerido"),
  fecha_inicio:        z.string().min(1, "Requerido"),
  fecha_fin:           z.string().min(1, "Requerido"),
  recompensa_cupon_id: z.string().optional(),
}).superRefine((d, ctx) => {
  if (d.fecha_inicio && d.fecha_fin && d.fecha_fin <= d.fecha_inicio) {
    ctx.addIssue({ code: "custom", message: "Debe ser posterior al inicio", path: ["fecha_fin"] });
  }
  const val = parseFloat(d.condicion_valor);
  if (isNaN(val) || val <= 0) {
    ctx.addIssue({ code: "custom", message: "Debe ser mayor a 0", path: ["condicion_valor"] });
  }
});

type FormData = z.infer<typeof schema>;

function toIso(date: string) { return `${date}T00:00:00`; }

/* ── Component ───────────────────────────────────────────────────────────── */

interface Props {
  open:     boolean;
  onClose:  () => void;
  onSuccess:(msg: string) => void;
  onError:  (msg: string) => void;
}

export default function RetoModal({ open, onClose, onSuccess, onError }: Props) {
  const { data: cupones } = useCupones("activo");
  const createReto = useCreateReto();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { condicion_tipo: "num_visitas" },
  });

  const tipo = watch("condicion_tipo");



  if (!open) return null;

  async function onSubmit(d: FormData) {
    try {
      await createReto.mutateAsync({
        nombre:              d.nombre,
        condicion_tipo:      d.condicion_tipo,
        condicion_valor:     parseFloat(d.condicion_valor),
        fecha_inicio:        toIso(d.fecha_inicio),
        fecha_fin:           toIso(d.fecha_fin),
        recompensa_cupon_id: d.recompensa_cupon_id || null,
      });
      onSuccess("Reto creado correctamente");
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      onError(msg || "Error al crear el reto");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-fade-up sm:animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-welve-100">
              <Target size={16} className="text-welve-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Nuevo reto</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:scale-95">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <Input
            {...register("nombre")}
            label="Nombre del reto"
            placeholder="Ej. El reto de fin de mes"
            error={errors.nombre?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              {...register("condicion_tipo")}
              label="Tipo de condición"
              error={errors.condicion_tipo?.message}
            >
              <option value="num_visitas">N° de visitas</option>
              <option value="monto_acumulado">Monto acumulado</option>
            </SelectField>

            <Input
              {...register("condicion_valor")}
              type="number"
              step="0.01"
              label={tipo === "num_visitas" ? "Visitas requeridas" : "Monto (S/)"}
              placeholder="0"
              error={errors.condicion_valor?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateField
              {...register("fecha_inicio")}
              label="Fecha de inicio"
              error={errors.fecha_inicio?.message}
            />
            <DateField
              {...register("fecha_fin")}
              label="Fecha de fin"
              error={errors.fecha_fin?.message}
            />
          </div>

          <SelectField
            {...register("recompensa_cupon_id")}
            label="Recompensa (cupón al completar)"
            hint="El cliente recibe este cupón automáticamente al cumplir la meta"
          >
            <option value="">Sin recompensa inmediata</option>
            {cupones?.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </SelectField>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors active:scale-[0.97]">
              Cancelar
            </button>
            <button type="submit" disabled={createReto.isPending}
              className="flex-1 rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white hover:bg-welve-600 transition-all active:scale-[0.97] disabled:opacity-60">
              {createReto.isPending ? "Creando..." : "Crear reto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
