import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input, TextareaField } from "../../ui";
import { RUBROS } from "../rubros";
import type { EmpresaForm } from "./EmpresaRegisterWizard";

interface Props {
  register: UseFormRegister<EmpresaForm>;
  errors: FieldErrors<EmpresaForm>;
  rubroActual: string;
  onRubroChange: (v: string) => void;
}

export default function PasoNegocio({ register, errors, rubroActual, onRubroChange }: Props) {
  return (
    <div className="space-y-4 animate-fade-up">
      <Input {...register("nombre")} label="Nombre del negocio" placeholder="Café Ritual" error={errors.nombre?.message} />

      <div>
        <span className="mb-2 block text-xs font-semibold text-gray-600">Rubro</span>
        <div className="grid grid-cols-2 gap-2">
          {RUBROS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onRubroChange(value)}
              className={[
                "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all duration-150",
                rubroActual === value
                  ? "border-welve-500 bg-welve-50 text-welve-700 ring-1 ring-welve-500"
                  : "border-[#E2DEFF] text-gray-600 hover:border-welve-300 hover:bg-welve-50/50",
              ].join(" ")}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="leading-tight">{label}</span>
            </button>
          ))}
        </div>
        {errors.rubro && <p className="mt-1.5 text-xs font-medium text-red-500 animate-fade-up">{errors.rubro.message}</p>}
      </div>

      <TextareaField {...register("descripcion")} label="Descripción breve (opcional)" placeholder="Cuéntanos de tu negocio..." rows={2} />
      <Input {...register("direccion")} label="Dirección (opcional)" placeholder="Av. Siempre Viva 123" />
    </div>
  );
}
