import { Calendar } from "lucide-react";
import { useCanjesPorDia } from "../../../../hooks/useMetricas";
import Widget from "../Widget";
import ActivityHeatmap from "../../../dashboard/ActivityHeatmap";

export default function CalendarioActividadWidget({ editMode }: { editMode: boolean }) {
  const { data, isLoading, isError, refetch } = useCanjesPorDia(84);

  return (
    <Widget
      title="Actividad de canjes — últimas 12 semanas"
      icon={Calendar}
      editMode={editMode}
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      onRefresh={() => refetch()}
    >
      <ActivityHeatmap data={data} />
    </Widget>
  );
}
