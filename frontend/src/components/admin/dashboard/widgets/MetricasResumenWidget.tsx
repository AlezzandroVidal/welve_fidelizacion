import { Gauge } from "lucide-react";
import { useResumen } from "../../../../hooks/useMetricas";
import Widget from "../Widget";
import SummaryCards from "../../../dashboard/SummaryCards";

export default function MetricasResumenWidget({ editMode }: { editMode: boolean }) {
  const { data, isLoading, isError, refetch } = useResumen();

  return (
    <Widget
      title="Resumen de métricas"
      icon={Gauge}
      editMode={editMode}
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      onRefresh={() => refetch()}
    >
      <SummaryCards data={data} isLoading={false} />
    </Widget>
  );
}
