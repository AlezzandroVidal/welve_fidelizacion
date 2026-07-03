import { ShoppingCart } from "lucide-react";
import { useResumenVentas } from "../../../../hooks/useVentas";
import Widget from "../Widget";

const MEDIO_LABEL: Record<string, string> = {
  efectivo: "Efectivo", tarjeta: "Tarjeta", yape: "Yape", plin: "Plin", mixto: "Mixto",
};

export default function ResumenVentasWidget({ editMode }: { editMode: boolean }) {
  const { data, isLoading, isError, refetch } = useResumenVentas();

  return (
    <Widget
      title="Ventas de hoy"
      icon={ShoppingCart}
      editMode={editMode}
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      onRefresh={() => refetch()}
    >
      {!data ? (
        <p className="py-8 text-center text-sm text-gray-400">Sin ventas aún</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-welve-50 p-3">
            <p className="text-2xl font-black text-welve-700">{data.ventasHoy}</p>
            <p className="text-xs text-gray-500">Ventas hoy</p>
          </div>
          <div className="rounded-xl bg-green-50 p-3">
            <p className="text-2xl font-black text-green-700">S/{data.montoHoy.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Monto hoy</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-lg font-bold text-gray-800">S/{data.ticketPromedioHoy.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Ticket promedio</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="truncate text-lg font-bold text-gray-800">{MEDIO_LABEL[data.metodoMasUsadoHoy ?? ""] ?? "—"}</p>
            <p className="text-xs text-gray-500">Medio más usado</p>
          </div>
        </div>
      )}
    </Widget>
  );
}
