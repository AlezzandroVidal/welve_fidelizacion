import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import type { CreateProductoDto, Producto, UpdateProductoDto } from "../../../api/productos";
import { useCreateProducto, useProductos, useUpdateProducto } from "../../../hooks/useProductos";
import { getCategoriasExtra } from "../../../utils/categorias";
import TabInfoGeneral from "./TabInfoGeneral";
import TabPreciosCodigos from "./TabPreciosCodigos";
import TabInventario from "./TabInventario";
import { productoSchema, type ProductoFormData } from "./schema";

type Tab = "info" | "precios" | "inventario";

interface Props {
  open: boolean;
  producto?: Producto | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function ProductoModal({ open, producto, onClose, onSuccess }: Props) {
  const isEdit = !!producto;
  const [tab, setTab] = useState<Tab>("info");
  const create = useCreateProducto();
  const update = useUpdateProducto();
  const pending = create.isPending || update.isPending;
  const { data: todos = [] } = useProductos();
  const categoriasExistentes = [
    ...new Set([...todos.map((p) => p.categoria).filter((c): c is string => !!c), ...getCategoriasExtra()]),
  ];

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema),
    defaultValues: producto
      ? {
          nombre: producto.nombre,
          tipo: producto.tipo,
          categoria: producto.categoria ?? "",
          subcategoria: producto.subcategoria ?? "",
          descripcion: producto.descripcion ?? "",
          imagen_url: producto.imagenUrl ?? "",
          precio_base: producto.precioBase.toString(),
          tiene_igv: producto.tieneIgv,
          sku: producto.sku,
          codigo_barras: producto.codigoBarras ?? "",
          gestionar_inventario: producto.gestionarInventario,
          stock_actual: producto.stockActual.toString(),
          stock_minimo: producto.stockMinimo.toString(),
          stock_maximo: producto.stockMaximo?.toString() ?? "",
          unidad_medida: producto.unidadMedida,
        }
      : {
          tipo: "producto",
          tiene_igv: true,
          gestionar_inventario: true,
          stock_actual: "0",
          stock_minimo: "5",
          unidad_medida: "unidad",
        },
  });

  const tipo = watch("tipo");
  const gestionarInventario = watch("gestionar_inventario") ?? true;
  const mostrarInventario = tipo === "producto";

  if (!open) return null;

  const TABS: { key: Tab; label: string }[] = [
    { key: "info", label: "Información general" },
    { key: "precios", label: "Precios y códigos" },
    ...(mostrarInventario ? [{ key: "inventario" as Tab, label: "Inventario" }] : []),
  ];

  async function onSubmit(d: ProductoFormData) {
    const base = {
      nombre: d.nombre,
      descripcion: d.descripcion?.trim() || null,
      categoria: d.categoria?.trim() || null,
      subcategoria: d.subcategoria?.trim() || null,
      sku: d.sku?.trim() || undefined,
      codigo_barras: d.codigo_barras?.trim() || null,
      precio_base: parseFloat(d.precio_base),
      tiene_igv: d.tiene_igv ?? true,
      imagen_url: d.imagen_url?.trim() || null,
      gestionar_inventario: mostrarInventario ? (d.gestionar_inventario ?? true) : false,
      stock_minimo: d.stock_minimo ? parseInt(d.stock_minimo, 10) : 5,
      stock_maximo: d.stock_maximo ? parseInt(d.stock_maximo, 10) : null,
      unidad_medida: d.unidad_medida as CreateProductoDto["unidad_medida"],
    };

    if (isEdit && producto) {
      const dto: UpdateProductoDto = base;
      await update.mutateAsync({ id: producto.id, data: dto });
      onSuccess("Producto actualizado");
    } else {
      const dto: CreateProductoDto = {
        ...base,
        tipo: d.tipo,
        stock_actual: mostrarInventario && d.stock_actual ? parseInt(d.stock_actual, 10) : 0,
      };
      await create.mutateAsync(dto);
      onSuccess("Producto creado");
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative z-10 flex w-full flex-col sm:max-w-2xl rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-fade-up sm:animate-scale-in"
        style={{ maxHeight: "92dvh" }}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">{isEdit ? "Editar producto" : "Nuevo producto"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:scale-95">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-shrink-0 gap-1 border-b border-gray-100 px-5 pt-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-t-lg px-3.5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px
                ${tab === t.key ? "border-welve-500 text-welve-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {tab === "info" && <TabInfoGeneral register={register} errors={errors} watch={watch} categoriasExistentes={categoriasExistentes} />}
            {tab === "precios" && <TabPreciosCodigos register={register} errors={errors} watch={watch} setValue={setValue} skuAutoHint={!isEdit} />}
            {tab === "inventario" && mostrarInventario && (
              <TabInventario register={register} errors={errors} gestionarInventario={gestionarInventario} />
            )}
          </div>

          <div className="flex flex-shrink-0 gap-4 border-t border-gray-100 p-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 active:scale-[0.97]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white transition-all hover:bg-welve-600 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
