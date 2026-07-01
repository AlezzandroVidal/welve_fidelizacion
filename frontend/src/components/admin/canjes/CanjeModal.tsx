import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useCreateCanje } from "../../../hooks/useCanjes";
import { useClientes } from "../../../hooks/useClientes";
import { useCupones } from "../../../hooks/useCupones";
import { SelectField } from "../../ui";

const schema = z.object({
  cliente_id: z.string().min(1, "Debes seleccionar un cliente"),
  cupon_id:   z.string().min(1, "Debes seleccionar un cupón"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open:     boolean;
  onClose:  () => void;
  onSuccess:(msg: string) => void;
  onError:  (msg: string) => void;
}

export default function CanjeModal({ open, onClose, onSuccess, onError }: Props) {
  const { data: clientes } = useClientes();
  const { data: cupones }  = useCupones("activo");
  const createCanje = useCreateCanje();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => { if (open) reset(); }, [open, reset]);

  if (!open) return null;

  async function onSubmit(d: FormData) {
    try {
      await createCanje.mutateAsync({
        clienteId: d.cliente_id,
        data: { cupon_id: d.cupon_id, canal: "staff_manual" },
      });
      onSuccess("Canje registrado correctamente");
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      onError(msg || "Error al registrar el canje");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl animate-fade-up sm:animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">Registrar canje manual</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 active:scale-95">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <SelectField
            {...register("cliente_id")}
            label="Cliente"
            error={errors.cliente_id?.message}
          >
            <option value="">Seleccionar cliente...</option>
            {clientes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}{c.email ? ` (${c.email})` : ""}
              </option>
            ))}
          </SelectField>

          <SelectField
            {...register("cupon_id")}
            label="Cupón activo"
            error={errors.cupon_id?.message}
          >
            <option value="">Seleccionar cupón...</option>
            {cupones?.filter((c) => c.estaVigente).map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </SelectField>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors active:scale-[0.97]">
              Cancelar
            </button>
            <button type="submit" disabled={createCanje.isPending}
              className="flex-1 rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white hover:bg-welve-600 transition-all active:scale-[0.97] disabled:opacity-60">
              {createCanje.isPending ? "Registrando..." : "Registrar canje"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
