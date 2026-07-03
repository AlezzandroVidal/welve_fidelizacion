import { Loader2 } from "lucide-react";

export default function ProcesandoStep() {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <Loader2 size={48} className="text-welve-500 animate-spin" />
      <div>
        <p className="text-base font-bold text-gray-900">Procesando tu pago...</p>
        <p className="mt-1 text-sm text-gray-400">No cierres esta ventana</p>
      </div>
      <div className="h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-gray-100">
        <div className="h-full w-1/3 rounded-full bg-welve-500 animate-[shimmer_1.2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
