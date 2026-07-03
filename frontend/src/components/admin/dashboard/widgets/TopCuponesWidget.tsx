import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";
import { useTopCupones } from "../../../../hooks/useMetricas";
import Widget from "../Widget";
import TopCupones from "../../../dashboard/TopCupones";

export default function TopCuponesWidget({ editMode }: { editMode: boolean }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useTopCupones(5);

  return (
    <Widget
      title="Top cupones"
      icon={Trophy}
      editMode={editMode}
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      onRefresh={() => refetch()}
    >
      <TopCupones data={data} onSelect={(cuponId) => navigate(`/admin/cupones?cupon=${cuponId}`)} />
    </Widget>
  );
}
