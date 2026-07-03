import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Target, Info, Gift, Calendar } from "lucide-react";
import { useCreateReto, useUpdateReto } from "../../../hooks/useRetos";
import { Input, DateField, Checkbox } from "../../ui";
import TabCondicionReto from "./TabCondicionReto";
import TabRecompensaReto from "./TabRecompensaReto";
import { retoFormSchema, CON_PERIODO, TABS_RETO, type RetoFormData, type TabIdReto } from "./retoFormSchema";
import type { Reto, TipoReto } from "../../../api/retos";

const TAB_ICONS: Record<TabIdReto, React.ElementType> = {
  info: Info, condicion: Target, recompensa: Gift, vigencia: Calendar,
};

function toDateInput(iso: string) { return iso.slice(0, 10); }
function toIso(date: string) { return `${date}T00:00:00`; }

interface Props {
  open: boolean;
  reto?: Reto | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function RetoModal({ open, reto, onClose, onSuccess, onError }: Props) {
  const isEdit = !!reto;
  const createReto = useCreateReto();
  const updateReto = useUpdateReto();
  const pending = createReto.isPending || updateReto.isPending;

  const [tab, setTab] = useState<TabIdReto>("info");
  const [productoObjetivoId, setProductoObjetivoId] = useState(reto?.productoObjetivoId ?? "");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RetoFormData>({
    resolver: zodResolver(retoFormSchema),
    defaultValues: reto
      ? {
          nombre: reto.nombre,
          condicion_tipo: reto.condicionTipo,
          condicion_valor: String(reto.condicionValor),
          periodo_dias: reto.periodoDias?.toString() ?? "",
          categoria_objetivo: reto.categoriaObjetivo ?? "",
          fecha_inicio: toDateInput(reto.fechaInicio),
          fecha_fin: toDateInput(reto.fechaFin),
          recompensa_cupon_id: reto.recompensaCuponId ?? "",
          descripcion_recompensa: reto.descripcionRecompensa ?? "",
          mostrar_progreso_publico: reto.mostrarProgresoPublico,
          notificar_al_completar: reto.notificarAlCompletar,
          mensaje_completado: reto.mensajeCompletado ?? "",
        }
      : { condicion_tipo: "num_visitas", mostrar_progreso_publico: true, notificar_al_completar: true },
  });

  const tipo = watch("condicion_tipo") as TipoReto;

  if (!open) return null;

  async function onSubmit(d: RetoFormData) {
    const payload = {
      condicion_valor: parseFloat(d.condicion_valor),
      periodo_dias: CON_PERIODO.includes(tipo) && d.periodo_dias ? parseInt(d.periodo_dias) : null,
      producto_objetivo_id: productoObjetivoId || null,
      categoria_objetivo: d.categoria_objetivo?.trim() || null,
      recompensa_cupon_id: d.recompensa_cupon_id || null,
      descripcion_recompensa: d.descripcion_recompensa?.trim() || null,
      mostrar_progreso_publico: d.mostrar_progreso_publico ?? true,
      notificar_al_completar: d.notificar_al_completar ?? true,
      mensaje_completado: d.mensaje_completado?.trim() || null,
    };
    try {
      if (isEdit && reto) {
        await updateReto.mutateAsync({
          id: reto.id,
          data: { nombre: d.nombre, fecha_fin: toIso(d.fecha_fin), ...payload },
        });
        onSuccess("Reto actualizado correctamente");
      } else {
        await createReto.mutateAsync({
          nombre: d.nombre,
          condicion_tipo: tipo,
          fecha_inicio: toIso(d.fecha_inicio),
          fecha_fin: toIso(d.fecha_fin),
          ...payload,
        });
        onSuccess("Reto creado correctamente");
      }
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      onError(msg || `Error al ${isEdit ? "actualizar" : "crear"} el reto`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-fade-up sm:animate-scale-in"
        style={{ maxHeight: "92dvh", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-welve-100">
              <Target size={16} className="text-welve-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">{isEdit ? "Editar reto" : "Nuevo reto"}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:scale-95">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-3 pt-2">
          {TABS_RETO.map((t) => {
            const Icon = TAB_ICONS[t.id];
            return (
              <button
                key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  tab === t.id ? "bg-welve-50 text-welve-700" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {tab === "info" && (
              <div className="space-y-5">
                <Input {...register("nombre")} label="Nombre del reto" placeholder="Ej. El reto de fin de mes" error={errors.nombre?.message} />
                <Checkbox
                  {...register("mostrar_progreso_publico")}
                  label="Mostrar progreso al cliente"
                  description="El cliente ve 'llevas X de Y' antes de completar el reto"
                />
              </div>
            )}
            {tab === "condicion" && (
              <TabCondicionReto
                register={register} errors={errors} tipo={tipo}
                onTipoChange={(t) => setValue("condicion_tipo", t)}
                productoObjetivoId={productoObjetivoId} onProductoObjetivoChange={setProductoObjetivoId}
                disabled={isEdit}
              />
            )}
            {tab === "recompensa" && <TabRecompensaReto register={register} errors={errors} />}
            {tab === "vigencia" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <DateField {...register("fecha_inicio")} label="Fecha de inicio" error={errors.fecha_inicio?.message} disabled={isEdit} />
                  <DateField {...register("fecha_fin")} label="Fecha de fin" error={errors.fecha_fin?.message} />
                </div>
                {isEdit && <p className="text-[11px] text-gray-400">La fecha de inicio no se puede cambiar una vez creado el reto.</p>}
              </div>
            )}
          </div>

          <div className="flex gap-4 border-t border-gray-100 p-6 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors active:scale-[0.97]">
              Cancelar
            </button>
            <button type="submit" disabled={pending}
              className="flex-1 rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white hover:bg-welve-600 transition-all active:scale-[0.97] disabled:opacity-60">
              {pending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear reto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
