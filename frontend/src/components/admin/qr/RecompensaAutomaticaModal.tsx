import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import type { RecompensaAutomatica } from "../../../api/qr";
import { useCupones } from "../../../hooks/useCupones";
import { useCrearRecompensaAutomatica, useEditarRecompensaAutomatica } from "../../../hooks/useQR";
import { Input, SelectField, Checkbox } from "../../ui";

const schema = z.object({
  visitas_requeridas: z.string().min(1, "Requerido"),
  cupon_id: z.string().min(1, "Selecciona un cupón"),
  descripcion: z.string().min(3, "Mínimo 3 caracteres"),
  activa: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  recompensa?: RecompensaAutomatica | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function RecompensaAutomaticaModal({ open, recompensa, onClose, onSuccess, onError }: Props) {
  const isEdit = !!recompensa;
  const { data: cupones = [] } = useCupones("activo");
  const crear = useCrearRecompensaAutomatica();
  const editar = useEditarRecompensaAutomatica();
  const pending = crear.isPending || editar.isPending;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: recompensa
      ? {
          visitas_requeridas: String(recompensa.visitasRequeridas),
          cupon_id: recompensa.cuponId,
          descripcion: recompensa.descripcion,
          activa: recompensa.activa,
        }
      : { activa: true },
  });

  if (!open) return null;

  async function onSubmit(d: FormData) {
    try {
      if (isEdit && recompensa) {
        await editar.mutateAsync({
          index: recompensa.index,
          data: {
            visitas_requeridas: parseInt(d.visitas_requeridas),
            cupon_id: d.cupon_id,
            descripcion: d.descripcion,
            activa: d.activa ?? true,
          },
        });
        onSuccess("Recompensa actualizada");
      } else {
        await crear.mutateAsync({
          visitas_requeridas: parseInt(d.visitas_requeridas),
          cupon_id: d.cupon_id,
          descripcion: d.descripcion,
        });
        onSuccess("Recompensa automática agregada");
      }
      onClose();
    } catch {
      onError(isEdit ? "No se pudo actualizar la recompensa" : "No se pudo agregar la recompensa");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-fade-up sm:animate-scale-in"
        style={{ maxHeight: "92dvh", overflowY: "auto" }}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? "Editar recompensa" : "Nueva recompensa automática"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          <Input
            {...register("visitas_requeridas")}
            type="number"
            min="1"
            label="Número de visitas"
            placeholder="Ej. 5"
            error={errors.visitas_requeridas?.message}
          />
          <SelectField
            {...register("cupon_id")}
            label="Cupón a entregar"
            error={errors.cupon_id?.message}
          >
            <option value="">Seleccionar...</option>
            {cupones.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </SelectField>
          <Input
            {...register("descripcion")}
            label="Descripción"
            placeholder="Ej. ¡Tu 5ta visita merece un regalo!"
            error={errors.descripcion?.message}
          />
          {isEdit && (
            <Checkbox
              {...register("activa")}
              label="Recompensa activa"
              description="Si la desactivas, deja de otorgarse aunque el cliente llegue al número de visitas"
            />
          )}

          <div className="flex gap-4 pt-2">
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
              {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar recompensa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
