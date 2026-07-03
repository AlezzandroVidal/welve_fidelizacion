import { useState } from "react";
import { X, Plus, Tag } from "lucide-react";
import type { Producto } from "../../../api/productos";
import { agregarCategoriaExtra, getCategoriasExtra } from "../../../utils/categorias";

interface Props {
  open: boolean;
  productos: Producto[];
  onClose: () => void;
}

export default function GestionarCategoriasModal({ open, productos, onClose }: Props) {
  const [nueva, setNueva] = useState("");
  const [extras, setExtras] = useState<string[]>(getCategoriasExtra());

  if (!open) return null;

  const conteo = new Map<string, number>();
  for (const p of productos) {
    if (p.categoria) conteo.set(p.categoria, (conteo.get(p.categoria) ?? 0) + 1);
  }
  for (const c of extras) if (!conteo.has(c)) conteo.set(c, 0);
  const categorias = [...conteo.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  function handleAgregar() {
    if (!nueva.trim()) return;
    setExtras(agregarCategoriaExtra(nueva));
    setNueva("");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">Categorías</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex gap-2">
            <input
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
              placeholder="Nueva categoría"
              className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-welve-500 focus:ring-[3px] focus:ring-welve-500/20"
            />
            <button
              onClick={handleAgregar}
              className="flex items-center gap-1 rounded-xl bg-welve-500 px-3 text-sm font-semibold text-white hover:bg-welve-600"
            >
              <Plus size={15} />
            </button>
          </div>

          {categorias.length === 0 ? (
            <p className="py-6 text-center text-xs text-gray-400">Aún no hay categorías</p>
          ) : (
            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {categorias.map(([nombre, count]) => (
                <div key={nombre} className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Tag size={13} className="text-gray-400" /> {nombre}
                  </span>
                  <span className="text-xs text-gray-400">{count} producto{count === 1 ? "" : "s"}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-gray-400">Las categorías se crean escribiéndolas en el formulario de producto — esta lista es solo para consulta rápida.</p>
        </div>
      </div>
    </div>
  );
}
