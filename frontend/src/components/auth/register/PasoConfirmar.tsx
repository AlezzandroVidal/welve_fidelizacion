import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Checkbox } from "../../ui";
import { RUBROS } from "../rubros";
import type { EmpresaForm } from "./EmpresaRegisterWizard";

interface Props {
  values: EmpresaForm;
  register: UseFormRegister<EmpresaForm>;
  errors: FieldErrors<EmpresaForm>;
}

function Fila({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}

export default function PasoConfirmar({ values, register, errors }: Props) {
  const rubroLabel = RUBROS.find((r) => r.value === values.rubro)?.label;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="rounded-xl border border-[#E2DEFF] bg-welve-50/50 p-4">
        <Fila label="Negocio" value={values.nombre} />
        <Fila label="Rubro" value={rubroLabel} />
        <Fila label="Dirección" value={values.direccion} />
        <div className="my-2 border-t border-[#E2DEFF]" />
        <Fila label="Administrador" value={values.admin_nombre} />
        <Fila label="Email" value={values.admin_email} />
        <Fila label="Teléfono" value={values.admin_telefono} />
      </div>

      <Checkbox
        {...register("aceptaTerminos")}
        label="Acepto los términos y condiciones"
        description="Y la política de privacidad de Welve"
      />
      {errors.aceptaTerminos && <p className="text-xs font-medium text-red-500 animate-fade-up">{errors.aceptaTerminos.message}</p>}
    </div>
  );
}
