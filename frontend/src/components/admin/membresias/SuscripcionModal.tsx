import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, UserPlus, Crown } from "lucide-react";
import { useCreateSuscripcion } from "../../../hooks/useMembresias";
import { useClientes } from "../../../hooks/useClientes";
import { Membresia } from "../../../api/membresias";
import { SelectField, DateField } from "../../ui";

const schema = z.object({
  cliente_id:   z.string().min(1, "Selecciona un cliente"),
  fecha_inicio: z.string().min(1, "Requerido"),
});
type FormData = z.infer<typeof schema>;

function toIso(date: string) { return `${date}T00:00:00`; }
function getToday() { return new Date().toISOString().split("T")[0]; }

interface Props {
  open:       boolean;
  onClose:    () => void;
  onSuccess:  (msg: string) => void;
  onError:    (msg: string) => void;
  planContext: Membresia | null;
}

export default function SuscripcionModal({ open, onClose, onSuccess, onError, planContext }: Props) {
  const { data: clientes } = useClientes();
  const createSub = useCreateSuscripcion();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fecha_inicio: getToday() },
  });

  useEffect(() => { if (open) reset({ fecha_inicio: getToday() }); }, [open, reset]);

  if (!open || !planContext) return null;

  async function onSubmit(d: FormData) {
    try {
      await createSub.mutateAsync({
        membresia_id: planContext!.id,
        cliente_id:   d.cliente_id,
        fecha_inicio: toIso(d.fecha_inicio),
      });
      onSuccess("Suscripción registrada exitosamente");
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      onError(msg || "Error al suscribir cliente");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-fade-up sm:animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-welve-100">
              <UserPlus size={16} className="text-welve-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Añadir suscriptor</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:scale-95">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Plan info chip */}
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <Crown size={16} className="text-amber-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-amber-500 font-semibold uppercase">Plan seleccionado</p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {planContext.nombre}
                <span className="text-amber-600 font-semibold ml-2">S/ {planContext.precio}</span>
              </p>
            </div>
          </div>

          <SelectField
            {...register("cliente_id")}
            label="Seleccionar cliente"
            error={errors.cliente_id?.message}
          >
            <option value="">Buscar en base de clientes...</option>
            {clientes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}{c.email ? ` (${c.email})` : ""}
              </option>
            ))}
          </SelectField>

          <DateField
            {...register("fecha_inicio")}
            label="Fecha de inicio"
            error={errors.fecha_inicio?.message}
            hint="Los cobros son manuales — Welve no procesa pagos automáticos por ahora"
          />

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors active:scale-[0.97]">
              Cancelar
            </button>
            <button type="submit" disabled={createSub.isPending}
              className="flex-1 rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white hover:bg-welve-600 transition-all active:scale-[0.97] disabled:opacity-60">
              {createSub.isPending ? "Registrando..." : "Registrar suscripción"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
