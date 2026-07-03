import { useState } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Footprints, CalendarClock, Wallet, TrendingUp, ShoppingBag, Star, Tags, Search, X } from "lucide-react";
import { Input, SelectField } from "../../ui";
import { useProductos } from "../../../hooks/useProductos";
import type { TipoReto } from "../../../api/retos";
import type { RetoFormData } from "./retoFormSchema";

const TIPOS: { value: TipoReto; label: string; hint: string; icon: React.ReactElement }[] = [
  { value: "num_visitas",        label: "Visitas totales",   hint: "Visita X veces en total",       icon: <Footprints size={18} /> },
  { value: "visitas_en_periodo", label: "Visitas en período", hint: "Visita X veces en Y días",      icon: <CalendarClock size={18} /> },
  { value: "monto_acumulado",    label: "Gasto total",       hint: "Gasta S/X en total",             icon: <Wallet size={18} /> },
  { value: "monto_en_periodo",   label: "Gasto en período",  hint: "Gasta S/X en Y días",            icon: <TrendingUp size={18} /> },
  { value: "productos_comprados",label: "Productos comprados", hint: "Compra X unidades de un producto", icon: <ShoppingBag size={18} /> },
  { value: "puntos_acumulados",  label: "Puntos acumulados", hint: "Acumula X puntos",               icon: <Star size={18} /> },
  { value: "monto_en_productos", label: "Gasto en productos", hint: "Gasta S/X en un producto/categoría", icon: <Tags size={18} /> },
];

const CON_PERIODO: TipoReto[] = ["visitas_en_periodo", "monto_en_periodo", "monto_en_productos"];
const CON_PRODUCTO: TipoReto[] = ["productos_comprados", "monto_en_productos"];

interface Props {
  register: UseFormRegister<RetoFormData>;
  errors: FieldErrors<RetoFormData>;
  tipo: TipoReto;
  onTipoChange: (t: TipoReto) => void;
  productoObjetivoId: string;
  onProductoObjetivoChange: (id: string) => void;
  disabled?: boolean;
}

export default function TabCondicionReto({
  register, errors, tipo, onTipoChange, productoObjetivoId, onProductoObjetivoChange, disabled,
}: Props) {
  const { data: productos = [] } = useProductos();
  const [busqueda, setBusqueda] = useState("");
  const productoSel = productos.find((p) => p.id === productoObjetivoId);
  const resultados = busqueda.trim()
    ? productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())).slice(0, 6)
    : [];

  return (
    <div className="space-y-5">
      <div>
        <span className="mb-2 block text-xs font-semibold text-gray-600">Tipo de condición</span>
        <div className="grid grid-cols-2 gap-2.5">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              type="button"
              disabled={disabled}
              onClick={() => onTipoChange(t.value)}
              className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                tipo === t.value ? "border-welve-500 bg-welve-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className={tipo === t.value ? "text-welve-600" : "text-gray-400"}>{t.icon}</span>
              <span className="text-xs font-bold text-gray-800">{t.label}</span>
              <span className="text-[10px] leading-tight text-gray-400">{t.hint}</span>
            </button>
          ))}
        </div>
        {disabled && (
          <p className="mt-2 text-[11px] text-gray-400">El tipo de condición no se puede cambiar una vez creado el reto.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          {...register("condicion_valor")}
          type="number" step="0.01"
          label={tipo === "puntos_acumulados" ? "Puntos requeridos" : tipo.startsWith("monto") ? "Monto (S/)" : "Cantidad"}
          error={errors.condicion_valor?.message}
        />
        {CON_PERIODO.includes(tipo) && (
          <Input
            {...register("periodo_dias")}
            type="number" min="1"
            label={tipo === "monto_en_productos" ? "Período (días) — opcional" : "Período (días)"}
            placeholder={tipo === "monto_en_productos" ? "Sin límite de tiempo" : "Ej. 30"}
            error={errors.periodo_dias?.message}
          />
        )}
      </div>

      {CON_PRODUCTO.includes(tipo) && (
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-gray-600">Producto objetivo</span>
          {productoSel ? (
            <span className="flex w-fit items-center gap-1.5 rounded-full bg-welve-100 py-1 pl-3 pr-1.5 text-xs font-medium text-welve-700">
              {productoSel.nombre}
              <button type="button" onClick={() => onProductoObjetivoChange("")} className="rounded-full p-0.5 hover:bg-welve-200">
                <X size={11} />
              </button>
            </span>
          ) : (
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto por nombre..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-welve-500 focus:ring-[3px] focus:ring-welve-500/20"
              />
              {resultados.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                  {resultados.map((p) => (
                    <button
                      key={p.id} type="button"
                      onClick={() => { onProductoObjetivoChange(p.id); setBusqueda(""); }}
                      className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <span>{p.nombre}</span>
                      <span className="font-mono text-[10px] text-gray-400">{p.sku}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <SelectField {...register("categoria_objetivo")} label="…o por categoría" hint="Alternativa a elegir un producto específico">
            <option value="">Sin categoría</option>
            {[...new Set(productos.map((p) => p.categoria).filter((c): c is string => !!c))].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </SelectField>
          {tipo === "monto_en_productos" && (
            <p className="mt-2 text-[11px] text-gray-400">
              Solo cuenta compras hechas desde el módulo de Caja — una visita registrada
              por staff sin venta asociada no queda incluida.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
