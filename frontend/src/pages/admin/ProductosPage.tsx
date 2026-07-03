import { useState } from "react";
import { Package, Plus, LayoutGrid, LayoutList, AlertTriangle, Tags } from "lucide-react";
import type { Producto } from "../../api/productos";
import { useProductos, useAlertasStock } from "../../hooks/useProductos";
import { useToast } from "../../hooks/useToast";
import ProductoModal from "../../components/admin/productos/ProductoModal";
import ProductoSheet from "../../components/admin/productos/ProductoSheet";
import GestionarCategoriasModal from "../../components/admin/productos/GestionarCategoriasModal";
import ProductoTableRow from "../../components/admin/productos/ProductoTableRow";
import ProductoGridCard from "../../components/admin/productos/ProductoGridCard";
import { Table, Input, Select, Toaster } from "../../components/ui";

type Tab = "todos" | "productos" | "servicios" | "agotados" | "alertas";
type View = "table" | "grid";

const TABS: { key: Tab; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "productos", label: "Productos" },
  { key: "servicios", label: "Servicios" },
  { key: "agotados", label: "Agotados" },
  { key: "alertas", label: "Alertas de stock" },
];

const TABLE_COLS = [
  { label: "Imagen" }, { label: "Nombre" }, { label: "Categoría" }, { label: "Tipo" },
  { label: "Precio" }, { label: "Stock" }, { label: "Estado" }, { label: "Acciones" },
];

export default function ProductosPage() {
  const [tab, setTab] = useState<Tab>("todos");
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [view, setView] = useState<View>(() => (localStorage.getItem("productos_view") as View) ?? "table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProducto, setEditProducto] = useState<Producto | null>(null);
  const [detalle, setDetalle] = useState<Producto | null>(null);
  const [categoriasModal, setCategoriasModal] = useState(false);
  const toast = useToast();

  const { data: all = [], isLoading } = useProductos();
  const { data: alertas = [] } = useAlertasStock();

  function switchView(v: View) { setView(v); localStorage.setItem("productos_view", v); }
  function openCreate() { setEditProducto(null); setModalOpen(true); }
  function openEdit(p: Producto) { setEditProducto(p); setModalOpen(true); setDetalle(null); }

  const categorias = [...new Set(all.map((p) => p.categoria).filter((c): c is string => !!c))];

  let productos = all;
  if (tab === "productos") productos = productos.filter((p) => p.tipo === "producto");
  if (tab === "servicios") productos = productos.filter((p) => p.tipo === "servicio");
  if (tab === "agotados") productos = productos.filter((p) => p.estado === "agotado");
  if (tab === "alertas") productos = productos.filter((p) => p.enAlertaStock);
  if (categoria !== "todas") productos = productos.filter((p) => p.categoria === categoria);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    productos = productos.filter((p) =>
      p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.codigoBarras ?? "").toLowerCase().includes(q));
  }

  return (
    <main className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-welve-100">
            <Package size={20} className="text-welve-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Productos e inventario</h1>
            <p className="text-xs text-gray-400">{all.length} productos y servicios</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-welve-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-welve-600 active:scale-[0.97]"
        >
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all
              ${tab === t.key ? "bg-welve-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-welve-300 hover:text-welve-600"}`}
          >
            {t.label}
            {t.key === "alertas" && alertas.length > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{alertas.length}</span>
            )}
          </button>
        ))}
      </div>

      {alertas.length > 0 && tab !== "alertas" && (
        <button
          onClick={() => setTab("alertas")}
          className="mb-4 flex w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-left text-sm text-amber-700 transition-colors hover:bg-amber-100"
        >
          <AlertTriangle size={15} className="flex-shrink-0" />
          <span>{alertas.length} producto{alertas.length === 1 ? "" : "s"} con stock bajo — <span className="font-semibold underline">Ver alertas</span></span>
        </button>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          variant="search"
          placeholder="Buscar por nombre, SKU o código de barras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
        <Select
          options={[{ value: "todas", label: "Todas las categorías" }, ...categorias.map((c) => ({ value: c, label: c }))]}
          value={categoria}
          onChange={setCategoria}
          className="w-52"
        />
        <button
          onClick={() => setCategoriasModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs font-semibold text-gray-600 transition-colors hover:border-welve-300 hover:text-welve-600"
        >
          <Tags size={14} /> Gestionar categorías
        </button>
        <div className="flex-1" />
        <div className="flex overflow-hidden rounded-lg border border-gray-200">
          {[{ v: "table" as View, icon: LayoutList }, { v: "grid" as View, icon: LayoutGrid }].map(({ v, icon: Icon }) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className={`px-3 py-2 transition-colors ${view === v ? "bg-welve-500 text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {view === "table" ? (
        <Table.Root>
          <Table.Header cols={TABLE_COLS} />
          {isLoading ? (
            <Table.Loading cols={TABLE_COLS.length} />
          ) : !productos.length ? (
            <Table.Empty icon={<Package size={36} />} message={search ? "Sin productos que coincidan" : "Sin productos aún"} />
          ) : (
            <Table.Body>
              {productos.map((p) => (
                <ProductoTableRow key={p.id} p={p} onClick={() => setDetalle(p)} onEdit={() => openEdit(p)} />
              ))}
            </Table.Body>
          )}
        </Table.Root>
      ) : !productos.length && !isLoading ? (
        <div className="py-20 text-center">
          <Package size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-400">Sin productos que mostrar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {productos.map((p) => (
            <ProductoGridCard key={p.id} p={p} onClick={() => setDetalle(p)} />
          ))}
        </div>
      )}

      <ProductoModal
        key={editProducto?.id ?? "new"}
        open={modalOpen}
        producto={editProducto}
        onClose={() => setModalOpen(false)}
        onSuccess={toast.success}
      />
      <ProductoSheet producto={detalle} onClose={() => setDetalle(null)} onEdit={openEdit} onSuccess={toast.success} />
      <GestionarCategoriasModal open={categoriasModal} productos={all} onClose={() => setCategoriasModal(false)} />
      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}
