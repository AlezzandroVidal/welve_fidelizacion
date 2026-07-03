import { TrendingUp } from "lucide-react";
import { useClientesNuevos } from "../../../../hooks/useMetricas";
import Widget from "../Widget";
import ClientesNuevosChart from "../../../dashboard/ClientesNuevosChart";

export default function ClientesNuevosWidget({ editMode }: { editMode: boolean }) {
  const { data, isLoading, isError, refetch } = useClientesNuevos(30);

  return (
    <Widget
      title="Clientes nuevos"
      icon={TrendingUp}
      editMode={editMode}
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      onRefresh={() => refetch()}
    >
      <ClientesNuevosChart data={data} />
    </Widget>
  );
}
