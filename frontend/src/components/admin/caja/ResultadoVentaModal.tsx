import { Check, Gift, Receipt } from "lucide-react";
import type { Venta } from "../../../api/ventas";
import { Button } from "../../ui";

interface Props {
  venta: Venta | null;
  onNuevaVenta: () => void;
  onVerComprobante: () => void;
}

export default function ResultadoVentaModal({ venta, onNuevaVenta, onVerComprobante }: Props) {
  if (!venta) return null;
  const resultado = venta.resultadoVisita;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1E1B2E]/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl animate-scale-in">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <Check size={36} className="text-green-500" strokeWidth={3} />
        </div>
        <p className="text-lg font-bold text-gray-900">Venta completada</p>
        <p className="mt-1 text-2xl font-black text-welve-600">S/ {venta.total.toFixed(2)}</p>

        <div className="mt-4 space-y-1.5 text-sm text-gray-600">
          {venta.clienteNombre && <p>Visita registrada para <span className="font-semibold">{venta.clienteNombre}</span></p>}
          {venta.cuponCodigo && <p>Cupón <span className="font-semibold">{venta.cuponCodigo}</span> aplicado</p>}
          {resultado?.recompensasDesbloqueadas.map((r) => (
            <p key={r.cuponId} className="flex items-center justify-center gap-1.5 font-semibold text-welve-600">
              <Gift size={15} /> {venta.clienteNombre ?? "El cliente"} ganó: {r.nombre}
            </p>
          ))}
          {venta.metodoPago === "efectivo" && !!venta.vuelto && (
            <p className="rounded-xl bg-gray-50 py-2 text-base font-bold text-gray-800">Vuelto: S/ {venta.vuelto.toFixed(2)}</p>
          )}
        </div>

        <div className="mt-5 flex gap-2.5">
          <Button variant="secondary" className="flex-1" onClick={onVerComprobante}>
            <Receipt size={15} /> Comprobante
          </Button>
          <Button className="flex-1" onClick={onNuevaVenta}>Nueva venta</Button>
        </div>
      </div>
    </div>
  );
}
