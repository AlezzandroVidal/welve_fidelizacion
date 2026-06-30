
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Crown } from "lucide-react";
import { useCreateMembresia } from "../../../hooks/useMembresias";
import { Input, SelectField, TextareaField } from "../../ui";

const schema = z.object({
  nombre:                z.string().min(3, "Mínimo 3 caracteres"),
  precio:                z.string().min(1, "Requerido"),
  beneficio_descripcion: z.string().min(5, "Sé más descriptivo"),
  frecuencia:            z.enum(["mensual", "anual"]),
}).superRefine((d, ctx) => {
  const val = parseFloat(d.precio);
  if (isNaN(val) || val <= 0) {
    ctx.addIssue({ code: "custom", message: "Debe ser mayor a 0", path: ["precio"] });
  }
});

type FormData = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; onSuccess: (msg: string) => void; onError: (msg: string) => void; }

export default function MembresiaModal({ open, onClose, onSuccess, onError }: Props) {
  const createPlan = useCreateMembresia();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { frecuencia: "mensual" },
  });



  if (!open) return null;

  async function onSubmit(d: FormData) {
    try {
      await createPlan.mutateAsync({
        nombre:                d.nombre,
        precio:                parseFloat(d.precio),
        beneficio_descripcion: d.beneficio_descripcion,
        frecuencia:            d.frecuencia,
      });
      onSuccess("Plan creado exitosamente");
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      onError(msg || "Error al crear plan");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-fade-up sm:animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Crown size={16} className="text-amber-500" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Nuevo plan de membresía</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:scale-95">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <Input
            {...register("nombre")}
            label="Nombre del club / plan"
            placeholder="Ej. Club VIP Mensual"
            error={errors.nombre?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register("precio")}
              type="number"
              step="0.01"
              min="0"
              label="Precio (S/)"
              placeholder="0.00"
              error={errors.precio?.message}
            />
            <SelectField
              {...register("frecuencia")}
              label="Frecuencia de cobro"
              error={errors.frecuencia?.message}
            >
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
            </SelectField>
          </div>

          <TextareaField
            {...register("beneficio_descripcion")}
            label="Descripción de beneficios"
            placeholder="Ej. 1 café gratis cada lunes, descuento del 20% siempre..."
            rows={3}
            error={errors.beneficio_descripcion?.message}
          />

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors active:scale-[0.97]">
              Cancelar
            </button>
            <button type="submit" disabled={createPlan.isPending}
              className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-all active:scale-[0.97] disabled:opacity-60">
              {createPlan.isPending ? "Guardando..." : "Crear plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
