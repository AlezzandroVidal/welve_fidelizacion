import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Target } from "lucide-react";
import { useUpdateReto } from "../../../hooks/useRetos";
import { useCupones } from "../../../hooks/useCupones";
import { Input, SelectField, DateField } from "../../ui";
import type { Reto } from "../../../api/retos";

const schema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres"),
  condicion_valor: z.string().min(1, "Requerido"),
  fecha_fin: z.string().min(1, "Requerido"),
  recompensa_cupon_id: z.string().optional(),
}).superRefine((d, ctx) => {
  const val = parseFloat(d.condicion_valor);
  if (isNaN(val) || val <= 0) {
    ctx.addIssue({ code: "custom", message: "Debe ser mayor a 0", path: ["condicion_valor"] });
  }
});

type FormData = z.infer<typeof schema>;

function toDateInput(iso: string) { return iso.slice(0, 10); }
function toIso(date: string) { return `${date}T00:00:00`; }

interface Props {
  reto: Reto | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function EditarRetoModal({ reto, onClose, onSuccess, onError }: Props) {
  const { data: cupones } = useCupones("activo");
  const updateReto = useUpdateReto();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: reto ? {
      nombre: reto.nombre,
      condicion_valor: String(reto.condicionValor),
      fecha_fin: toDateInput(reto.fechaFin),
      recompensa_cupon_id: reto.recompensaCuponId ?? "",
    } : undefined,
  });

  if (!reto) return null;

  async function onSubmit(d: FormData) {
    try {
      await updateReto.mutateAsync({
        id: reto!.id,
        data: {
          nombre: d.nombre,
          condicion_valor: parseFloat(d.condicion_valor),
          fecha_fin: toIso(d.fecha_fin),
          recompensa_cupon_id: d.recompensa_cupon_id || null,
        },
      });
      onSuccess("Reto actualizado correctamente");
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      onError(msg || "Error al actualizar el reto");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-fade-up sm:animate-scale-in">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-welve-100">
              <Target size={16} className="text-welve-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Editar reto</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:scale-95">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <Input
            {...register("nombre")}
            label="Nombre del reto"
            error={errors.nombre?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register("condicion_valor")}
              type="number"
              step="0.01"
              label={reto.condicionTipo === "num_visitas" ? "Visitas requeridas" : "Monto (S/)"}
              error={errors.condicion_valor?.message}
            />
            <DateField
              {...register("fecha_fin")}
              label="Fecha de fin"
              error={errors.fecha_fin?.message}
            />
          </div>
          <p className="text-[11px] text-gray-400">
            El tipo de condición y la fecha de inicio no se pueden cambiar una vez creado el reto.
          </p>

          <SelectField
            {...register("recompensa_cupon_id")}
            label="Recompensa (cupón al completar)"
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
            <button type="submit" disabled={updateReto.isPending}
              className="flex-1 rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white hover:bg-welve-600 transition-all active:scale-[0.97] disabled:opacity-60">
              {updateReto.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
