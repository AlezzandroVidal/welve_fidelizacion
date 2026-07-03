import { Printer } from "lucide-react";
import type { Venta } from "../../../api/ventas";
import { Sheet, Button } from "../../ui";
import { imprimirTicket } from "../../../utils/imprimirTicket";

const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo", tarjeta: "Tarjeta", yape: "Yape", plin: "Plin", mixto: "Mixto",
};

interface Props {
  venta: Venta | null;
  onClose: () => void;
}

export default function TicketVenta({ venta, onClose }: Props) {
  return (
    <Sheet open={!!venta} onClose={onClose} title="Comprobante de venta" subtitle={venta ? new Date(venta.createdAt).toLocaleString("es-PE") : undefined}>
      {venta && (
        <div className="space-y-4">
          <p className="text-center text-lg font-black text-welve-500">Welve</p>

          <div className="divide-y divide-dashed divide-gray-200 rounded-xl border border-gray-100 px-4">
            {venta.items.map((item) => (
              <div key={item.productoId} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700">{item.cantidad}x {item.nombreProducto}</span>
                <span className="font-semibold tabular-nums text-gray-800">S/ {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="tabular-nums">S/ {venta.subtotal.toFixed(2)}</span></div>
            {venta.descuentoMonto > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento{venta.cuponCodigo ? ` (${venta.cuponCodigo})` : ""}</span>
                <span className="tabular-nums">-S/ {venta.descuentoMonto.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500"><span>IGV (18%)</span><span className="tabular-nums">S/ {venta.igv.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-gray-100 pt-1.5 text-base font-bold text-gray-900">
              <span>TOTAL</span><span className="tabular-nums">S/ {venta.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
            <p>Método de pago: <span className="font-semibold">{METODO_LABEL[venta.metodoPago] ?? venta.metodoPago}</span></p>
            {venta.clienteNombre && (
              <p>Cliente: <span className="font-semibold">{venta.clienteNombre}</span>{" "}
                {venta.codigoCliente && <span className="font-mono text-xs text-gray-400">({venta.codigoCliente})</span>}
              </p>
            )}
          </div>

          <Button variant="secondary" className="w-full" onClick={() => imprimirTicket(venta)}>
            <Printer size={15} /> Imprimir
          </Button>
        </div>
      )}
    </Sheet>
  );
}
