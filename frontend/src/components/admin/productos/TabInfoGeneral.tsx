import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Package, Sparkles } from "lucide-react";
import { Input, TextareaField, ImageUpload } from "../../ui";
import type { ProductoFormData } from "./schema";

interface Props {
  register: UseFormRegister<ProductoFormData>;
  errors: FieldErrors<ProductoFormData>;
  watch: UseFormWatch<ProductoFormData>;
  setValue: UseFormSetValue<ProductoFormData>;
  categoriasExistentes: string[];
}

export default function TabInfoGeneral({ register, errors, watch, setValue, categoriasExistentes }: Props) {
  const tipo = watch("tipo");
  const imagenUrl = watch("imagen_url");

  return (
    <div className="space-y-5">
      <Input {...register("nombre")} label="Nombre" placeholder="Ej. Café americano" error={errors.nombre?.message} />

      <div>
        <p className="mb-2 text-xs font-semibold text-gray-500">Tipo</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "producto", label: "Producto", icon: Package, hint: "Con inventario" },
            { value: "servicio", label: "Servicio", icon: Sparkles, hint: "Sin stock" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all
                ${tipo === opt.value ? "border-welve-500 bg-welve-50" : "border-gray-200 hover:border-welve-300"}`}
            >
              <input type="radio" value={opt.value} {...register("tipo")} className="hidden" />
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tipo === opt.value ? "bg-welve-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                <opt.icon size={18} />
              </div>
              <span className={`text-sm font-semibold ${tipo === opt.value ? "text-welve-700" : "text-gray-700"}`}>{opt.label}</span>
              <span className="text-[10px] text-gray-400">{opt.hint}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            {...register("categoria")}
            label="Categoría"
            placeholder="Ej. Bebidas"
            list="categorias-existentes"
            error={errors.categoria?.message}
          />
          <datalist id="categorias-existentes">
            {categoriasExistentes.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <Input {...register("subcategoria")} label="Subcategoría" placeholder="Opcional" />
      </div>

      <TextareaField {...register("descripcion")} label="Descripción" placeholder="Breve descripción del producto o servicio" rows={3} />

      <div>
        <p className="mb-2 text-xs font-semibold text-gray-500">Imagen</p>
        <div className="w-40">
          <ImageUpload
            value={imagenUrl || null}
            onChange={(v) => setValue("imagen_url", v, { shouldValidate: true })}
            shape="square"
            placeholder="Imagen del producto"
          />
        </div>
      </div>
    </div>
  );
}
