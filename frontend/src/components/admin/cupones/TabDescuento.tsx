import { useState } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Percent, Coins, Gift, Users, Layers, Truck, Sparkles, Search, X } from "lucide-react";
import { Input, TextareaField } from "../../ui";
import { useProductos } from "../../../hooks/useProductos";
import type { TipoCupon } from "../../../api/cupones";
import type { CuponFormData } from "./cuponFormSchema";

const TIPOS: { value: TipoCupon; label: string; icon: React.ReactElement }[] = [
  { value: "porcentual",      label: "% OFF",      icon: <Percent size={18} /> },
  { value: "monto_fijo",      label: "S/ OFF",     icon: <Coins size={18} /> },
  { value: "producto_gratis", label: "Gratis",     icon: <Gift size={18} /> },
  { value: "dos_por_uno",     label: "2x1",        icon: <Users size={18} /> },
  { value: "n_por_m",         label: "NxM",        icon: <Layers size={18} /> },
  { value: "envio_gratis",    label: "Envío gratis", icon: <Truck size={18} /> },
  { value: "personalizado",   label: "Custom",     icon: <Sparkles size={18} /> },
];

const NECESITA_PRODUCTO: TipoCupon[] = ["producto_gratis", "dos_por_uno", "n_por_m"];

interface Props {
  register: UseFormRegister<CuponFormData>;
  errors: FieldErrors<CuponFormData>;
  tipo: TipoCupon;
  onTipoChange: (t: TipoCupon) => void;
  productoGratisId: string;
  onProductoGratisChange: (id: string) => void;
  disabled?: boolean;
}

export default function TabDescuento({
  register, errors, tipo, onTipoChange, productoGratisId, onProductoGratisChange, disabled,
}: Props) {
  const { data: productos = [] } = useProductos();
  const [busqueda, setBusqueda] = useState("");
  const productoSel = productos.find((p) => p.id === productoGratisId);
  const resultados = busqueda.trim()
    ? productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())).slice(0, 6)
    : [];

  return (
    <div className="space-y-5">
      <div>
        <span className="mb-2 block text-xs font-semibold text-gray-600">Tipo de descuento</span>
        <div className="grid grid-cols-3 gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.value} type="button" disabled={disabled}
              onClick={() => onTipoChange(t.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                tipo === t.value ? "border-welve-500 bg-welve-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className={tipo === t.value ? "text-welve-600" : "text-gray-400"}>{t.icon}</span>
              <span className="text-[11px] font-bold text-gray-800">{t.label}</span>
            </button>
          ))}
        </div>
        {disabled && <p className="mt-2 text-[11px] text-gray-400">El tipo no se puede cambiar una vez creado el cupón.</p>}
      </div>

      {tipo === "porcentual" && (
        <div>
          <Input {...register("valor")} type="number" step="1" min="1" max="100" readOnly={disabled}
            label="Porcentaje de descuento (%)" placeholder="Ej. 15" error={errors.valor?.message} />
          <p className="mt-1 text-xs text-gray-400">El cliente paga el resto del precio con este % de descuento.</p>
        </div>
      )}

      {tipo === "monto_fijo" && (
        <Input {...register("valor")} type="number" step="0.01" min="0" readOnly={disabled}
          label="Monto de descuento (S/)" placeholder="Ej. 10" error={errors.valor?.message} />
      )}

      {tipo === "n_por_m" && (
        <div className="grid grid-cols-2 gap-4">
          <Input {...register("cantidad_paga")} type="number" min="1" readOnly={disabled}
            label="Cantidad que paga" placeholder="Ej. 2" error={errors.cantidad_paga?.message} />
          <Input {...register("cantidad_lleva")} type="number" min="1" readOnly={disabled}
            label="Cantidad que lleva" placeholder="Ej. 3" error={errors.cantidad_lleva?.message} />
        </div>
      )}

      {tipo === "personalizado" && (
        <TextareaField {...register("descripcion_larga")} label="Describe la promoción" rows={3}
          placeholder="Ej. Sorpresa especial del mes según disponibilidad" />
      )}

      {NECESITA_PRODUCTO.includes(tipo) && (
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-gray-600">
            {tipo === "producto_gratis" ? "¿Qué producto va gratis?" : "¿En qué producto aplica?"}
          </span>
          {productoSel ? (
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-welve-100 py-1 pl-3 pr-1.5 text-xs font-medium text-welve-700">
              {productoSel.nombre} <span className="text-welve-400">S/{productoSel.precioBase?.toFixed(2)}</span>
              <button type="button" onClick={() => onProductoGratisChange("")} className="rounded-full p-0.5 hover:bg-welve-200">
                <X size={11} />
              </button>
            </span>
          ) : (
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto por nombre..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-welve-500 focus:ring-[3px] focus:ring-welve-500/20"
              />
              {resultados.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                  {resultados.map((p) => (
                    <button key={p.id} type="button"
                      onClick={() => { onProductoGratisChange(p.id); setBusqueda(""); }}
                      className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-gray-50">
                      <span>{p.nombre}</span>
                      <span className="text-[10px] text-gray-400">S/{p.precioBase?.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="mt-1 text-[11px] text-gray-400">Opcional — si lo dejas vacío, aplica a cualquier producto.</p>
        </div>
      )}

      <Input {...register("monto_minimo")} type="number" step="0.01" min="0"
        label="Monto mínimo de compra" placeholder="Sin mínimo (opcional)" error={errors.monto_minimo?.message} />
    </div>
  );
}
