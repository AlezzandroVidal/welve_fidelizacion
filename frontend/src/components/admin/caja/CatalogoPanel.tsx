import { useState } from "react";
import { Search, ScanBarcode, Package } from "lucide-react";
import type { Producto } from "../../../api/productos";
import { productosApi } from "../../../api/productos";
import { useProductos } from "../../../hooks/useProductos";
import { useToast } from "../../../hooks/useToast";
import { reproducirBeep } from "../../../utils/beep";
import BarcodeScannerModal from "./BarcodeScannerModal";

interface Props {
  onAgregar: (producto: Producto) => void;
}

export default function CatalogoPanel({ onAgregar }: Props) {
  const { data: productos = [], isLoading } = useProductos({ estado: "activo" });
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [scannerOpen, setScannerOpen] = useState(false);
  const toast = useToast();

  const categorias = [...new Set(productos.map((p) => p.categoria).filter((c): c is string => !!c))];

  let visibles = productos.filter((p) => p.disponibleParaVenta);
  if (categoria !== "todas") visibles = visibles.filter((p) => p.categoria === categoria);
  if (busqueda.trim()) {
    const q = busqueda.trim().toLowerCase();
    visibles = visibles.filter((p) =>
      p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.codigoBarras ?? "").toLowerCase().includes(q));
  }

  async function handleCodigo(codigo: string) {
    try {
      const { data: producto } = await productosApi.buscarPorCodigo(codigo);
      reproducirBeep();
      onAgregar(producto);
      toast.success(`${producto.nombre} agregado`);
      setScannerOpen(false);
    } catch {
      toast.error(`Sin resultados para "${codigo}"`);
    }
  }

  function agotado(p: Producto) {
    return p.gestionarInventario && p.stockActual <= 0;
  }

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-card">
      {/* Buscador principal */}
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca por nombre, SKU o escanea código de barras..."
            className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-base outline-none transition-colors focus:border-welve-500 focus:bg-white focus:ring-[3px] focus:ring-welve-500/20"
          />
        </div>
        <button
          onClick={() => setScannerOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-welve-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-welve-600"
        >
          <ScanBarcode size={20} />
        </button>
      </div>

      {/* Categorías */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {["todas", ...categorias].map((c) => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all
              ${categoria === c ? "bg-welve-500 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {c === "todas" ? "Todas" : c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-400">Cargando catálogo...</p>
        ) : !visibles.length ? (
          <div className="py-16 text-center">
            <Package size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-400">Sin productos que coincidan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibles.map((p) => {
              const sinStock = agotado(p);
              return (
                <button
                  key={p.id}
                  disabled={sinStock}
                  onClick={() => onAgregar(p)}
                  className={`flex flex-col overflow-hidden rounded-2xl border text-left transition-all
                    ${sinStock ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60" : "border-gray-100 bg-white hover:border-welve-300 hover:shadow-md active:scale-[0.97]"}`}
                >
                  <div className="flex h-24 w-full items-center justify-center bg-gray-50">
                    {p.imagenUrl ? (
                      <img src={p.imagenUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package size={26} className="text-gray-200" />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-sm font-semibold text-gray-800">{p.nombre}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-welve-600">S/ {p.precioConIgv.toFixed(2)}</span>
                      {sinStock ? (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-600">AGOTADO</span>
                      ) : p.gestionarInventario ? (
                        <span className="text-[10px] text-gray-400">{p.stockActual} disp.</span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onCodigo={handleCodigo} />
    </div>
  );
}
