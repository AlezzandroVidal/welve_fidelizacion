import { useNavigate } from "react-router-dom";
import { PackageX, CheckCircle2, Package } from "lucide-react";
import { useAlertasStock } from "../../../../hooks/useProductos";
import Widget from "../Widget";

export default function AlertasStockWidget({ editMode }: { editMode: boolean }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useAlertasStock();

  return (
    <Widget
      title="Alertas de stock"
      icon={PackageX}
      editMode={editMode}
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      onRefresh={() => refetch()}
    >
      {!data?.length ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CheckCircle2 size={24} className="text-green-500" />
          <p className="text-sm font-semibold text-green-600">Todo el stock en orden</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((p) => {
            const critico = p.stockActual <= 0;
            return (
              <li key={p.id} className="flex items-center gap-3">
                {p.imagenUrl ? (
                  <img src={p.imagenUrl} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    <Package size={16} className="text-gray-300" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{p.nombre}</p>
                  <p className={`text-xs font-semibold ${critico ? "text-red-500" : "text-amber-500"}`}>
                    Stock: {p.stockActual} / mín. {p.stockMinimo}
                  </p>
                </div>
                <button
                  onClick={() => navigate("/admin/inventario")}
                  className="flex-shrink-0 rounded-lg bg-welve-50 px-3 py-1.5 text-xs font-semibold text-welve-600 hover:bg-welve-100"
                >
                  Reponer
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Widget>
  );
}
