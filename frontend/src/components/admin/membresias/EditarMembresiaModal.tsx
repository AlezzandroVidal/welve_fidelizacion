import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Crown } from "lucide-react";
import { useUpdateMembresia } from "../../../hooks/useMembresias";
import { Input, TextareaField } from "../../ui";
import type { Membresia } from "../../../api/membresias";

const schema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres"),
  precio: z.string().min(1, "Requerido"),
  beneficio_descripcion: z.string().min(5, "Sé más descriptivo"),
}).superRefine((d, ctx) => {
  const val = parseFloat(d.precio);
  if (isNaN(val) || val <= 0) {
    ctx.addIssue({ code: "custom", message: "Debe ser mayor a 0", path: ["precio"] });
  }
});

type FormData = z.infer<typeof schema>;

interface Props {
  plan: Membresia | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function EditarMembresiaModal({ plan, onClose, onSuccess, onError }: Props) {
  const updatePlan = useUpdateMembresia();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: plan ? {
      nombre: plan.nombre,
      precio: String(plan.precio),
      beneficio_descripcion: plan.beneficioDescripcion,
    } : undefined,
  });

  if (!plan) return null;

  async function onSubmit(d: FormData) {
    try {
      await updatePlan.mutateAsync({
        id: plan!.id,
        data: { nombre: d.nombre, precio: parseFloat(d.precio), beneficio_descripcion: d.beneficio_descripcion },
      });
      onSuccess("Plan actualizado correctamente");
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      onError(msg || "Error al actualizar el plan");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-fade-up sm:animate-scale-in">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Crown size={16} className="text-amber-500" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Editar plan</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:scale-95">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <Input
            {...register("nombre")}
            label="Nombre del club / plan"
            error={errors.nombre?.message}
          />
          <Input
            {...register("precio")}
            type="number"
            step="0.01"
            min="0"
            label={`Precio (S/) — cobro ${plan.frecuencia}`}
            error={errors.precio?.message}
          />
          <TextareaField
            {...register("beneficio_descripcion")}
            label="Descripción de beneficios"
            rows={3}
            error={errors.beneficio_descripcion?.message}
          />
          <p className="text-[11px] text-gray-400">La frecuencia de cobro no se puede cambiar una vez creado el plan.</p>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors active:scale-[0.97]">
              Cancelar
            </button>
            <button type="submit" disabled={updatePlan.isPending}
              className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-all active:scale-[0.97] disabled:opacity-60">
              {updatePlan.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
