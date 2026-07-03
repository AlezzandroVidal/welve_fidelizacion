import { RefreshCw } from "lucide-react";
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Input, Checkbox } from "../../ui";
import { generarEAN13 } from "../../../utils/barcode";
import BarcodePreview from "./BarcodePreview";
import type { ProductoFormData } from "./schema";

interface Props {
  register: UseFormRegister<ProductoFormData>;
  errors: FieldErrors<ProductoFormData>;
  watch: UseFormWatch<ProductoFormData>;
  setValue: UseFormSetValue<ProductoFormData>;
  skuAutoHint?: boolean;
}

export default function TabPreciosCodigos({ register, errors, watch, setValue, skuAutoHint }: Props) {
  const precioBase = parseFloat(watch("precio_base") || "0") || 0;
  const tieneIgv = watch("tiene_igv");
  const codigoBarras = watch("codigo_barras") || "";
  const precioConIgv = tieneIgv ? precioBase * 1.18 : precioBase;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 items-start gap-4">
        <Input
          {...register("precio_base")}
          type="number" step="0.01" min="0"
          label="Precio base (sin IGV)"
          placeholder="0.00"
          error={errors.precio_base?.message}
        />
        <div className="pt-2">
          <Checkbox
            {...register("tiene_igv")}
            label="Incluye IGV"
            description={`Precio final: S/ ${precioConIgv.toFixed(2)}`}
          />
        </div>
      </div>

      <Input
        {...register("sku")}
        label="SKU"
        placeholder={skuAutoHint ? "Se genera automáticamente" : undefined}
        hint="Déjalo vacío para autogenerar a partir de la categoría"
        error={errors.sku?.message}
      />

      <div>
        <div className="flex items-end gap-2">
          <Input {...register("codigo_barras")} label="Código de barras" placeholder="Escanea o genera uno" className="flex-1" />
          <button
            type="button"
            onClick={() => setValue("codigo_barras", generarEAN13())}
            className="mb-[1px] flex h-[52px] flex-shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition-colors hover:border-welve-300 hover:text-welve-600"
          >
            <RefreshCw size={14} /> Generar EAN-13
          </button>
        </div>
        {codigoBarras && <div className="mt-3"><BarcodePreview codigo={codigoBarras} /></div>}
      </div>
    </div>
  );
}
