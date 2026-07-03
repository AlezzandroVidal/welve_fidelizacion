import { useState } from "react";
import { X, Search } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "../../ui";
import { useProductos } from "../../../hooks/useProductos";
import type { AplicaCupon } from "../../../api/cupones";
import type { CuponFormData } from "./cuponFormSchema";

interface Props {
  register: UseFormRegister<CuponFormData>;
  errors: FieldErrors<CuponFormData>;
  aplicaA: AplicaCupon;
  onAplicaAChange: (v: AplicaCupon) => void;
  productosValidos: string[];
  onProductosValidosChange: (ids: string[]) => void;
  categoriasValidas: string[];
  onCategoriasValidasChange: (cats: string[]) => void;
}

const OPCIONES: { value: AplicaCupon; label: string; hint: string }[] = [
  { value: "todo", label: "Todo el carrito", hint: "Sin restricción de productos" },
  { value: "productos_especificos", label: "Productos específicos", hint: "Solo aplica a ciertos productos" },
  { value: "categoria", label: "Por categoría", hint: "Solo aplica a ciertas categorías" },
];

/** Sección "Productos válidos" del form de cupón, para el módulo de Caja/POS
 * — extraída de CuponModal.tsx para no pasar de 200 líneas. */
export default function SeccionProductosValidos({
  register, errors, aplicaA, onAplicaAChange,
  productosValidos, onProductosValidosChange, categoriasValidas, onCategoriasValidasChange,
}: Props) {
  const { data: productos = [] } = useProductos();
  const [busqueda, setBusqueda] = useState("");
  const categorias = [...new Set(productos.map((p) => p.categoria).filter((c): c is string => !!c))];

  const productosSeleccionados = productos.filter((p) => productosValidos.includes(p.id));
  const resultados = busqueda.trim()
    ? productos.filter((p) => !productosValidos.includes(p.id) && p.nombre.toLowerCase().includes(busqueda.toLowerCase())).slice(0, 6)
    : [];

  function agregarProducto(id: string) {
    onProductosValidosChange([...productosValidos, id]);
    setBusqueda("");
  }
  function quitarProducto(id: string) {
    onProductosValidosChange(productosValidos.filter((p) => p !== id));
  }
  function toggleCategoria(cat: string) {
    onCategoriasValidasChange(
      categoriasValidas.includes(cat) ? categoriasValidas.filter((c) => c !== cat) : [...categoriasValidas, cat],
    );
  }

  return (
    <div className="space-y-4 border-t border-gray-100 pt-5">
      <h3 className="text-sm font-bold text-gray-900">¿A qué aplica este cupón?</h3>

      <div className="space-y-2">
        {OPCIONES.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors ${aplicaA === opt.value ? "border-welve-500 bg-welve-50" : "border-gray-200"}`}
          >
            <input type="radio" className="mt-0.5" checked={aplicaA === opt.value} onChange={() => onAplicaAChange(opt.value)} />
            <div>
              <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
              <p className="text-xs text-gray-400">{opt.hint}</p>
            </div>
          </label>
        ))}
      </div>

      {aplicaA === "productos_especificos" && (
        <div>
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
                    key={p.id}
                    type="button"
                    onClick={() => agregarProducto(p.id)}
                    className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <span>{p.nombre}</span>
                    <span className="font-mono text-[10px] text-gray-400">{p.sku}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {productosSeleccionados.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {productosSeleccionados.map((p) => (
                <span key={p.id} className="flex items-center gap-1.5 rounded-full bg-welve-100 py-1 pl-3 pr-1.5 text-xs font-medium text-welve-700">
                  {p.nombre} <span className="font-mono text-[9px] text-welve-400">{p.sku}</span>
                  <button type="button" onClick={() => quitarProducto(p.id)} className="rounded-full p-0.5 hover:bg-welve-200">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {aplicaA === "categoria" && (
        <div className="flex flex-wrap gap-1.5">
          {categorias.length === 0 ? (
            <p className="text-xs text-gray-400">No hay categorías registradas todavía</p>
          ) : categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategoria(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${categoriasValidas.includes(cat) ? "bg-welve-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <Input
        {...register("monto_minimo_carrito")}
        type="number" step="0.01" min="0"
        label="Monto mínimo del carrito"
        placeholder="Sin mínimo (opcional)"
        error={errors.monto_minimo_carrito?.message}
      />
    </div>
  );
}
