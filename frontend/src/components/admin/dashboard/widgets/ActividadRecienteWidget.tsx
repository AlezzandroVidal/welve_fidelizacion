import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { canjesApi } from "../../../../api/canjes";
import Widget from "../Widget";
import RecentActivity from "../../../dashboard/RecentActivity";

export default function ActividadRecienteWidget({ editMode }: { editMode: boolean }) {
  // Mismo queryKey que useCanjes() (comparten caché) — el refetchInterval acá
  // hace que ese cache se mantenga fresco cada 60s mientras este widget esté montado.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["canjes", "list"],
    queryFn: () => canjesApi.list().then((r) => r.data),
    refetchInterval: 60_000,
  });

  return (
    <Widget
      title="Actividad reciente"
      icon={Activity}
      editMode={editMode}
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      onRefresh={() => refetch()}
    >
      <RecentActivity data={data} />
    </Widget>
  );
}
