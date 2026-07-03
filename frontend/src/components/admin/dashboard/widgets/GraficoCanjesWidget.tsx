import { useState } from "react";
import { AreaChart } from "lucide-react";
import { useCanjesPorDia } from "../../../../hooks/useMetricas";
import Widget from "../Widget";
import CanjesChart from "../../../dashboard/CanjesChart";

const PERIODOS = [
  { dias: 7, label: "7d" },
  { dias: 14, label: "14d" },
  { dias: 30, label: "30d" },
] as const;

export default function GraficoCanjesWidget({ editMode }: { editMode: boolean }) {
  const [dias, setDias] = useState<number>(30);
  const { data, isLoading, isError, refetch } = useCanjesPorDia(dias);

  return (
    <Widget
      title="Canjes por día"
      icon={AreaChart}
      editMode={editMode}
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      onRefresh={() => refetch()}
      headerExtra={
        <div className="flex rounded-lg bg-gray-50 p-0.5 text-xs font-semibold">
          {PERIODOS.map((p) => (
            <button
              key={p.dias}
              onClick={() => setDias(p.dias)}
              className={`rounded-md px-2 py-1 transition-colors ${dias === p.dias ? "bg-white text-welve-600 shadow-sm" : "text-gray-400"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      <CanjesChart data={data} />
    </Widget>
  );
}
