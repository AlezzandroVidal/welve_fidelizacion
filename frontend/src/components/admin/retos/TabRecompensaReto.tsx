import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Gift } from "lucide-react";
import { Input, SelectField, Checkbox, TextareaField } from "../../ui";
import { useCupones } from "../../../hooks/useCupones";
import type { RetoFormData } from "./retoFormSchema";

const TIPO_LABEL: Record<string, string> = {
  porcentual: "% OFF", monto_fijo: "S/ OFF", producto_gratis: "Gratis",
  dos_por_uno: "2x1", n_por_m: "NxM", envio_gratis: "Envío gratis", personalizado: "Promo",
};

interface Props {
  register: UseFormRegister<RetoFormData>;
  errors: FieldErrors<RetoFormData>;
}

export default function TabRecompensaReto({ register, errors }: Props) {
  const { data: cupones } = useCupones("activo");

  return (
    <div className="space-y-5">
      <SelectField
        {...register("recompensa_cupon_id")}
        label="Cupón que se desbloquea al completar"
        hint="El cliente recibe este cupón automáticamente al cumplir la meta"
      >
        <option value="">Sin recompensa inmediata</option>
        {cupones?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre} — {TIPO_LABEL[c.tipo] ?? c.tipo}
          </option>
        ))}
      </SelectField>

      <Input
        {...register("descripcion_recompensa")}
        label="Descripción corta de la recompensa"
        placeholder="Ej. Café gratis"
        hint="Texto breve que ve el cliente para entender el premio"
        error={errors.descripcion_recompensa?.message}
      />

      <Checkbox
        {...register("notificar_al_completar")}
        label="Notificar al cliente al completar"
        description="Envía una notificación en-app apenas cumple la meta"
      />

      <TextareaField
        {...register("mensaje_completado")}
        label="Mensaje de notificación (opcional)"
        placeholder="Default: '¡Completaste el reto {nombre}!'"
        rows={2}
      />

      <div className="flex items-start gap-2 rounded-xl border border-welve-100 bg-welve-50 p-3">
        <Gift size={16} className="mt-0.5 shrink-0 text-welve-500" />
        <p className="text-xs text-welve-700">
          El reto también puede desbloquear un cupón <strong>visibilidad=por_reto</strong> desde el
          formulario de ese cupón (pestaña Visibilidad y acceso) — ahí el cliente ve su progreso
          antes de canjear, en vez de recibirlo automáticamente.
        </p>
      </div>
    </div>
  );
}
