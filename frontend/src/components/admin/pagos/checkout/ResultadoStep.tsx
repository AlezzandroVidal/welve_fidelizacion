import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../../../ui";
import type { Pago } from "../../../../api/pagos";

interface Props {
  pago: Pago;
  planNombre: string;
  onContinuar: () => void;
  onReintentar: () => void;
  onCancelar: () => void;
}

export default function ResultadoStep({ pago, planNombre, onContinuar, onReintentar, onCancelar }: Props) {
  if (pago.estado === "aprobado") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 animate-scale-in">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">¡Pago exitoso!</p>
          <p className="mt-1 text-sm text-gray-500">Tu plan {planNombre} está activo</p>
        </div>
        <p className="rounded-lg bg-gray-50 px-3 py-1.5 font-mono text-xs text-gray-500">{pago.referencia}</p>
        <p className="text-xs text-gray-400">Recibirás tu comprobante por email.</p>
        <Button onClick={onContinuar} className="w-full mt-2" size="lg">Continuar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 animate-scale-in">
        <XCircle size={40} className="text-red-500" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">No pudimos procesar tu pago</p>
        <p className="mt-1 text-sm text-gray-500">{pago.motivoRechazo ?? "Pago rechazado"}</p>
      </div>
      <div className="flex w-full gap-3 mt-2">
        <Button variant="secondary" onClick={onCancelar} className="flex-1">Cancelar</Button>
        <Button onClick={onReintentar} className="flex-1">Intentar con otro método</Button>
      </div>
    </div>
  );
}
