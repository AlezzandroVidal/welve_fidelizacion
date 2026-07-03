import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input, DateField, Checkbox } from "../../ui";
import type { CuponFormData } from "./cuponFormSchema";

interface Props {
  register: UseFormRegister<CuponFormData>;
  errors: FieldErrors<CuponFormData>;
  sinLimite?: boolean;
  disabledFechaInicio?: boolean;
}

/** Tab "Vigencia y límites" — extraída de CuponModal.tsx para no pasar de
 * 200 líneas. */
export default function TabVigencia({ register, errors, sinLimite, disabledFechaInicio }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <DateField {...register("fecha_inicio")} label="Fecha inicio" error={errors.fecha_inicio?.message} disabled={disabledFechaInicio} />
        <DateField {...register("fecha_expiracion")} label="Fecha expiración" error={errors.fecha_expiracion?.message} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input {...register("limite_usos_total")} type="number" min="1" disabled={sinLimite}
          label="Límite usos totales" placeholder="Sin límite" error={errors.limite_usos_total?.message} />
        <Input {...register("limite_usos_por_cliente")} type="number" min="1"
          label="Límite por cliente" error={errors.limite_usos_por_cliente?.message} />
      </div>
      <Checkbox {...register("sin_limite")} label="Sin límite de usos totales" />
    </>
  );
}
