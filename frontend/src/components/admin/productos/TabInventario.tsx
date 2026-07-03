import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input, SelectField, Checkbox } from "../../ui";
import type { ProductoFormData } from "./schema";

interface Props {
  register: UseFormRegister<ProductoFormData>;
  errors: FieldErrors<ProductoFormData>;
  gestionarInventario: boolean;
}

const UNIDADES = [
  { value: "unidad", label: "Unidad" },
  { value: "kg",      label: "Kilogramo" },
  { value: "litro",   label: "Litro" },
  { value: "metro",   label: "Metro" },
  { value: "hora",    label: "Hora" },
  { value: "sesion",  label: "Sesión" },
];

export default function TabInventario({ register, errors, gestionarInventario }: Props) {
  return (
    <div className="space-y-5">
      <Checkbox
        {...register("gestionar_inventario")}
        label="Gestionar inventario"
        description="Descuenta stock automáticamente en cada venta y habilita alertas"
      />

      {gestionarInventario && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Input {...register("stock_actual")} type="number" min="0" label="Stock inicial" error={errors.stock_actual?.message} />
            <Input {...register("stock_minimo")} type="number" min="0" label="Stock mínimo" error={errors.stock_minimo?.message} />
          </div>
          <Input {...register("stock_maximo")} type="number" min="0" label="Stock máximo" placeholder="Sin límite (opcional)" />
          <SelectField {...register("unidad_medida")} label="Unidad de medida">
            {UNIDADES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </SelectField>
        </>
      )}
    </div>
  );
}
