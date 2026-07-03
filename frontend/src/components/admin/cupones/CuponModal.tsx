import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Info, Percent, Package, Eye, Calendar } from "lucide-react";
import type {
  AccesoVisibilidad, AplicaCupon, Cupon, CreateCuponDto, TipoCupon, TipoRequisito, UpdateCuponDto,
} from "../../../api/cupones";
import { useCreateCupon, useUpdateCupon } from "../../../hooks/useCupones";
import { Input } from "../../ui";
import CuponModalContenido from "./CuponModalContenido";
import SeccionProductosValidos from "./SeccionProductosValidos";
import TabDescuento from "./TabDescuento";
import TabVisibilidad from "./TabVisibilidad";
import TabVigencia from "./TabVigencia";
import { cuponFormSchema, TABS_CUPON, CAMPOS_POR_TAB, type CuponFormData, type TabIdCupon } from "./cuponFormSchema";
import { buildCamposComunes, toIso } from "./buildCuponPayload";

const TAB_ICONS: Record<TabIdCupon, React.ElementType> = {
  basico: Info, descuento: Percent, productos: Package, visibilidad: Eye, vigencia: Calendar,
};

function toDateStr(iso: string) { return iso.slice(0, 10); }

interface Props {
  open:     boolean;
  cupon?:   Cupon | null;
  onClose:  () => void;
  onSuccess:(msg: string) => void;
}

export default function CuponModal({ open, cupon, onClose, onSuccess }: Props) {
  const isEdit  = !!cupon;
  const create  = useCreateCupon();
  const update  = useUpdateCupon();
  const pending = create.isPending || update.isPending;

  const [tab, setTab] = useState<TabIdCupon>("basico");
  const [imagen, setImagen] = useState<string | null>(cupon?.imagenUrl ?? null);
  const [tags, setTags] = useState<string[]>(cupon?.tags ?? []);
  const [colorTema, setColorTema] = useState<string | null>(cupon?.colorTema ?? null);
  const [aplicaA, setAplicaA] = useState<AplicaCupon>(cupon?.aplicaA ?? "todo");
  const [productosValidos, setProductosValidos] = useState<string[]>(cupon?.productosValidos ?? []);
  const [categoriasValidas, setCategoriasValidas] = useState<string[]>(cupon?.categoriasValidas ?? []);
  const [productoGratisId, setProductoGratisId] = useState(cupon?.productoGratisId ?? "");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CuponFormData>({
    resolver: zodResolver(cuponFormSchema),
    defaultValues: cupon
      ? {
          nombre:                  cupon.nombre,
          codigo:                  cupon.codigo ?? "",
          tipo:                    cupon.tipo,
          valor:                   cupon.valor?.toString() ?? "",
          cantidad_paga:           cupon.cantidadPaga?.toString() ?? "",
          cantidad_lleva:          cupon.cantidadLleva?.toString() ?? "",
          monto_minimo:            cupon.montoMinimo?.toString() ?? "",
          fecha_inicio:            toDateStr(cupon.fechaInicio),
          fecha_expiracion:        toDateStr(cupon.fechaExpiracion),
          limite_usos_total:       cupon.limiteUsosTotal?.toString() ?? "",
          limite_usos_por_cliente: cupon.limiteUsosPorCliente?.toString() ?? "1",
          sin_limite:              cupon.limiteUsosTotal == null,
          visibilidad:             cupon.visibilidad,
          reto_id:                 cupon.retoId ?? "",
          requisito_tipo:          cupon.requisito?.tipo ?? "",
          requisito_valor:         cupon.requisito?.valor?.toString() ?? "",
          requisito_periodo_dias:  cupon.requisito?.periodo_dias?.toString() ?? "",
          notificar_al_desbloquear:cupon.notificarAlDesbloquear,
          mensaje_notificacion:    cupon.mensajeNotificacion ?? "",
          destacado:               cupon.destacado,
          terminos_condiciones:    cupon.terminosCondiciones ?? "",
          descripcion_larga:       cupon.descripcionLarga ?? "",
          instrucciones_canje:     cupon.instruccionesCanje ?? "",
          monto_minimo_carrito:    cupon.montoMinimoCarrito?.toString() ?? "",
        }
      : {
          limite_usos_por_cliente: "1", destacado: false, visibilidad: "publico", tipo: "",
          notificar_al_desbloquear: true,
        },
  });

  const tipo               = watch("tipo") as TipoCupon;
  const visibilidad        = watch("visibilidad") as AccesoVisibilidad;
  const requisitoTipo      = watch("requisito_tipo") as TipoRequisito | "";
  const sinLimite          = watch("sin_limite");
  const descripcionLargaValue = watch("descripcion_larga") ?? "";

  if (!open) return null;

  function tabTieneError(id: TabIdCupon) {
    return CAMPOS_POR_TAB[id].some((campo) => campo in errors);
  }

  async function onSubmit(d: CuponFormData) {
    const camposComunes = buildCamposComunes(d, {
      imagen, tags, colorTema, aplicaA, productosValidos, categoriasValidas, productoGratisId,
    });

    if (isEdit && cupon) {
      const dto: UpdateCuponDto = { nombre: d.nombre, codigo: d.codigo?.trim() || null, ...camposComunes };
      await update.mutateAsync({ id: cupon.id, data: dto });
      onSuccess("Cupón actualizado");
    } else {
      const dto: CreateCuponDto = {
        nombre: d.nombre,
        codigo: d.codigo?.trim() || null,
        tipo: tipo,
        valor: (tipo === "porcentual" || tipo === "monto_fijo") && d.valor ? parseFloat(d.valor) : null,
        cantidad_paga:  tipo === "n_por_m" && d.cantidad_paga  ? parseInt(d.cantidad_paga)  : null,
        cantidad_lleva: tipo === "n_por_m" && d.cantidad_lleva ? parseInt(d.cantidad_lleva) : null,
        fecha_inicio: toIso(d.fecha_inicio),
        ...camposComunes,
      };
      await create.mutateAsync(dto);
      onSuccess("Cupón creado");
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative z-10 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl
          animate-fade-up sm:animate-scale-in flex flex-col"
        style={{ maxHeight: "92dvh" }}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">{isEdit ? "Editar cupón" : "Nuevo cupón"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:scale-95">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-3 pt-2">
          {TABS_CUPON.map((t) => {
            const Icon = TAB_ICONS[t.id];
            return (
              <button
                key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  tab === t.id ? "bg-welve-50 text-welve-700" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon size={14} /> {t.label}
                {tabTieneError(t.id) && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {tab === "basico" && (
              <>
                <Input {...register("nombre")} label="Nombre" placeholder="Ej. 15% en tu próxima compra" error={errors.nombre?.message} />
                <Input {...register("codigo")} label="Código para la Caja" placeholder="Se autogenera (ej. CUP-4F2A)"
                  hint="El staff lo escanea o lo escribe en la Caja para aplicar este cupón" error={errors.codigo?.message} />
                <CuponModalContenido
                  register={register} errors={errors} descripcionLargaValue={descripcionLargaValue}
                  imagen={imagen} onImagenChange={setImagen}
                  tags={tags} onTagsChange={setTags}
                  colorTema={colorTema} onColorTemaChange={setColorTema}
                />
              </>
            )}

            {tab === "descuento" && (
              <TabDescuento
                register={register} errors={errors} tipo={tipo}
                onTipoChange={(t) => setValue("tipo", t)}
                productoGratisId={productoGratisId} onProductoGratisChange={setProductoGratisId}
                disabled={isEdit}
              />
            )}

            {tab === "productos" && (
              <SeccionProductosValidos
                register={register} errors={errors} aplicaA={aplicaA} onAplicaAChange={setAplicaA}
                productosValidos={productosValidos} onProductosValidosChange={setProductosValidos}
                categoriasValidas={categoriasValidas} onCategoriasValidasChange={setCategoriasValidas}
              />
            )}

            {tab === "visibilidad" && (
              <TabVisibilidad
                register={register} errors={errors} visibilidad={visibilidad}
                onVisibilidadChange={(v) => setValue("visibilidad", v)}
                requisitoTipo={requisitoTipo}
              />
            )}

            {tab === "vigencia" && (
              <TabVigencia register={register} errors={errors} sinLimite={sinLimite} disabledFechaInicio={isEdit} />
            )}
          </div>

          <div className="flex gap-4 border-t border-gray-100 p-6 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 active:scale-[0.97]">
              Cancelar
            </button>
            <button type="submit" disabled={pending}
              className="flex-1 rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white transition-all hover:bg-welve-600 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed">
              {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cupón"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
