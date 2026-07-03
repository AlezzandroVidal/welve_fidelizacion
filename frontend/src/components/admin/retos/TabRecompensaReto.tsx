import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Gift, Check } from "lucide-react";
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
  cuponesAsignados: string[];
  onCuponesAsignadosChange: (ids: string[]) => void;
}

export default function TabRecompensaReto({ register, errors, cuponesAsignados, onCuponesAsignadosChange }: Props) {
  const { data: cupones } = useCupones("activo");

  function toggle(id: string) {
    onCuponesAsignadosChange(
      cuponesAsignados.includes(id) ? cuponesAsignados.filter((c) => c !== id) : [...cuponesAsignados, id],
    );
  }

  return (
    <div className="space-y-5">
      <SelectField
        {...register("recompensa_cupon_id")}
        label="Cupón que se desbloquea al completar (automático)"
        hint="El cliente recibe este cupón de inmediato, ya canjeado, al cumplir la meta"
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

      <div className="border-t border-gray-100 pt-4">
        <div className="mb-1 flex items-center gap-2">
          <Gift size={14} className="text-welve-500" />
          <span className="text-xs font-semibold text-gray-600">
            Cupones que este reto desbloquea (el cliente los ve y los canjea él mismo)
          </span>
        </div>
        <p className="mb-3 text-[11px] text-gray-400">
          A diferencia de la recompensa automática de arriba, estos cupones quedan
          visibilidad=por_reto: el cliente ve su progreso antes de completar, y un reto
          puede desbloquear varios a la vez.
        </p>
        <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-gray-100 p-2">
          {!cupones?.length && <p className="p-2 text-xs text-gray-400">No hay cupones activos todavía.</p>}
          {cupones?.map((c) => {
            const checked = cuponesAsignados.includes(c.id);
            return (
              <button
                key={c.id} type="button" onClick={() => toggle(c.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  checked ? "bg-welve-50" : "hover:bg-gray-50"
                }`}
              >
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                  checked ? "border-welve-500 bg-welve-500" : "border-gray-300"
                }`}>
                  {checked && <Check size={11} className="text-white" />}
                </span>
                <span className="flex-1 truncate text-sm text-gray-700">{c.nombre}</span>
                <span className="text-[10px] text-gray-400">{TIPO_LABEL[c.tipo] ?? c.tipo}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
