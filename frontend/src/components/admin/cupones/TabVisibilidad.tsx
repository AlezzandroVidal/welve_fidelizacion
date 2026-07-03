import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Globe, Star, Trophy, BarChart3, Lock } from "lucide-react";
import { Input, SelectField, Checkbox, TextareaField } from "../../ui";
import { useRetos } from "../../../hooks/useRetos";
import type { AccesoVisibilidad, TipoRequisito } from "../../../api/cupones";
import type { CuponFormData } from "./cuponFormSchema";

const OPCIONES: { value: AccesoVisibilidad; label: string; hint: string; icon: React.ReactElement }[] = [
  { value: "publico",       label: "Público",        hint: "Todos los clientes lo ven y pueden usarlo",             icon: <Globe size={18} /> },
  { value: "vip",           label: "Solo VIP",       hint: "Clientes en segmento \"exclusivo\"",                    icon: <Star size={18} /> },
  { value: "por_reto",      label: "Por reto",       hint: "Se desbloquea al completar un reto",                    icon: <Trophy size={18} /> },
  { value: "por_requisito", label: "Por requisito",  hint: "Se desbloquea al cumplir una condición",                icon: <BarChart3 size={18} /> },
  { value: "privado",       label: "Privado",        hint: "Va directo a cuponera al desbloquearse, sin mostrarse", icon: <Lock size={18} /> },
];

const TIPOS_REQUISITO: { value: TipoRequisito; label: string }[] = [
  { value: "visitas_totales",   label: "Visitas totales" },
  { value: "visitas_en_periodo",label: "Visitas en período" },
  { value: "gasto_total",       label: "Gasto total (S/)" },
  { value: "gasto_en_periodo",  label: "Gasto en período (S/)" },
  { value: "puntos_acumulados", label: "Puntos acumulados" },
];

const CON_PERIODO: TipoRequisito[] = ["visitas_en_periodo", "gasto_en_periodo"];
const CON_DESBLOQUEO: AccesoVisibilidad[] = ["por_reto", "por_requisito", "privado"];

interface Props {
  register: UseFormRegister<CuponFormData>;
  errors: FieldErrors<CuponFormData>;
  visibilidad: AccesoVisibilidad;
  onVisibilidadChange: (v: AccesoVisibilidad) => void;
  requisitoTipo: TipoRequisito | "";
}

export default function TabVisibilidad({ register, errors, visibilidad, onVisibilidadChange, requisitoTipo }: Props) {
  const { data: retos } = useRetos();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {OPCIONES.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors ${
              visibilidad === opt.value ? "border-welve-500 bg-welve-50" : "border-gray-200"
            }`}
          >
            <input type="radio" className="mt-0.5" checked={visibilidad === opt.value} onChange={() => onVisibilidadChange(opt.value)} />
            <span className={`mt-0.5 ${visibilidad === opt.value ? "text-welve-600" : "text-gray-400"}`}>{opt.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
              <p className="text-xs text-gray-400">{opt.hint}</p>
            </div>
          </label>
        ))}
      </div>

      {visibilidad === "por_reto" && (
        <SelectField {...register("reto_id")} label="¿Qué reto debe completar?" error={errors.reto_id?.message}>
          <option value="">Seleccionar reto...</option>
          {retos?.filter((r) => !r.cancelado).map((r) => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </SelectField>
      )}

      {visibilidad === "por_requisito" && (
        <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <SelectField {...register("requisito_tipo")} label="Tipo de requisito">
            <option value="">Seleccionar...</option>
            {TIPOS_REQUISITO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </SelectField>
          <div className="grid grid-cols-2 gap-4">
            <Input {...register("requisito_valor")} type="number" step="0.01" min="0"
              label="Valor requerido" error={errors.requisito_valor?.message} />
            {requisitoTipo && CON_PERIODO.includes(requisitoTipo) && (
              <Input {...register("requisito_periodo_dias")} type="number" min="1"
                label="Período (días)" placeholder="Ej. 30" error={errors.requisito_periodo_dias?.message} />
            )}
          </div>
        </div>
      )}

      {CON_DESBLOQUEO.includes(visibilidad) && (
        <>
          <Checkbox
            {...register("notificar_al_desbloquear")}
            label="Notificar al cliente cuando se desbloquee"
            description="Le llega una notificación en-app apenas cumple la condición"
          />
          <TextareaField
            {...register("mensaje_notificacion")}
            label="Mensaje de notificación (opcional)"
            placeholder="Default: '¡Desbloqueaste este cupón!'"
            rows={2}
          />
          {visibilidad === "por_reto" && (
            <p className="text-[11px] text-gray-400">
              El progreso visible antes de desbloquear se controla desde el reto asociado
              (pestaña "Mostrar progreso al cliente" en su formulario).
            </p>
          )}
        </>
      )}
    </div>
  );
}
