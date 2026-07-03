import { useRef, useState } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Camera, X } from "lucide-react";
import { Input, TextareaField, Checkbox, TagsInput } from "../../ui";
import type { CuponFormData } from "./cuponFormSchema";

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [imagenErr, setImagenErr] = useState("");

  async function handleImagenFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setImagenErr("La imagen supera 2 MB"); return; }
    setImagenErr("");
    onImagenChange(await fileToDataUri(f));
  }

  return (
    <div className="space-y-5 border-t border-gray-100 pt-5">
      <h3 className="text-sm font-bold text-gray-900">Contenido visual</h3>

      <div>
        <span className="mb-1.5 block text-xs font-semibold text-gray-600">Imagen del cupón</span>
        <div
          className="group relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#E2DEFF] bg-welve-50/40"
          onClick={() => fileRef.current?.click()}
        >
          {imagen ? (
            <>
              <img src={imagen} alt="Imagen del cupón" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={18} className="text-white" />
                <span className="text-xs font-medium text-white">Cambiar</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onImagenChange(null); }}
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-gray-600 hover:bg-white"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <Camera size={22} />
              <span className="text-xs font-medium">Subir foto de la promo</span>
            </div>
          )}
        </div>
        {imagenErr && <p className="mt-1 text-xs text-red-500">{imagenErr}</p>}
        <p className="mt-1 text-[10px] text-gray-400">JPG, PNG o WebP · máx. 2 MB (opcional)</p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagenFile} />
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
