import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input, TextareaField, Checkbox, TagsInput, ImageUpload } from "../../ui";
import type { CuponFormData } from "./cuponFormSchema";

const COLORES_TEMA = ["#7C5CFC", "#3B82F6", "#10B981", "#F97316", "#EC4899", "#F59E0B"];

interface Props {
  register: UseFormRegister<CuponFormData>;
  errors: FieldErrors<CuponFormData>;
  descripcionLargaValue: string;
  imagen: string | null;
  onImagenChange: (dataUri: string | null) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  colorTema: string | null;
  onColorTemaChange: (color: string | null) => void;
}

/** Sección "Contenido visual" del form de cupón — extraída de CuponModal.tsx
 * para no pasar de 200 líneas. */
export default function CuponModalContenido({
  register, errors, descripcionLargaValue,
  imagen, onImagenChange, tags, onTagsChange, colorTema, onColorTemaChange,
}: Props) {
  return (
    <div className="space-y-5 border-t border-gray-100 pt-5">
      <h3 className="text-sm font-bold text-gray-900">Contenido visual</h3>

      <div>
        <span className="mb-1.5 block text-xs font-semibold text-gray-600">Imagen del cupón</span>
        <ImageUpload
          value={imagen}
          onChange={(v) => onImagenChange(v || null)}
          shape="landscape"
          placeholder="Imagen del cupón"
        />
      </div>

      <div>
        <TextareaField
          {...register("descripcion_larga")}
          label="Descripción larga"
          placeholder="Describe el beneficio en 2-3 oraciones atractivas"
          rows={3}
          maxLength={500}
        />
        <p className="mt-1 text-right text-[10px] text-gray-400">{descripcionLargaValue?.length ?? 0}/500</p>
      </div>

      <Input
        {...register("instrucciones_canje")}
        label="Instrucciones de canje"
        placeholder="Ej. Menciona 'WELVE' al pedir"
        error={errors.instrucciones_canje?.message}
      />

      <TextareaField
        {...register("terminos_condiciones")}
        label="Términos y condiciones"
        placeholder="Ej. No acumulable con otras promociones. Válido de lunes a viernes."
        rows={3}
      />

      <TagsInput
        label="Tags"
        value={tags}
        onChange={onTagsChange}
        placeholder="Ej. bebidas, desayuno"
      />

      <div>
        <span className="mb-1.5 block text-xs font-semibold text-gray-600">Color de tema</span>
        <div className="flex gap-2">
          {COLORES_TEMA.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColorTemaChange(colorTema === c ? null : c)}
              className={`h-8 w-8 rounded-full border-2 transition-transform active:scale-95 ${
                colorTema === c ? "border-gray-900 scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <Checkbox
        {...register("destacado")}
        label="Destacar en el inicio del cliente"
        description="Se muestra en el carrusel de ofertas destacadas de la app del cliente"
      />
    </div>
  );
}
