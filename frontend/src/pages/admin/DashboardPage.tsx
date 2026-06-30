import SummaryCards from "../../components/dashboard/SummaryCards";
import CanjesChart from "../../components/dashboard/CanjesChart";
import TopCupones from "../../components/dashboard/TopCupones";
import ActivityHeatmap from "../../components/dashboard/ActivityHeatmap";
import ClientesNuevosChart from "../../components/dashboard/ClientesNuevosChart";
import RecentActivity from "../../components/dashboard/RecentActivity";
import { useResumen, useCanjesPorDia, useTopCupones, useClientesNuevos, useEmpresa } from "../../hooks/useMetricas";

const PLAN_LABEL: Record<string, string> = {
  starter:     "Starter",
  growth:      "Growth",
  pro:         "Pro",
  basico:      "Básico",
  profesional: "Profesional",
  enterprise:  "Enterprise",
};

const PLAN_COLOR: Record<string, string> = {
  starter:     "bg-gray-100 text-gray-600",
  growth:      "bg-welve-100 text-welve-700",
  pro:         "bg-amber-100 text-amber-700",
  basico:      "bg-gray-100 text-gray-600",
  profesional: "bg-welve-100 text-welve-700",
  enterprise:  "bg-amber-100 text-amber-700",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function fmtDate(): string {
  return new Date().toLocaleDateString("es-PE", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default function DashboardPage() {
  const resumen  = useResumen();
  const canjes   = useCanjesPorDia(30);
  const cupones  = useTopCupones(5);
  const heatmap  = useCanjesPorDia(84);
  const clientes = useClientesNuevos(30);
  const empresa  = useEmpresa();

  const plan = empresa.data?.planSuscripcion ?? "";

  return (
    <main className="p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 animate-fade-up">
        <div>
          <p className="text-xs text-gray-400 capitalize">{fmtDate()}</p>
          <h1 className="mt-0.5 text-xl font-bold text-gray-900">
            {greeting()}, {empresa.data?.nombre ?? "—"}
          </h1>
        </div>
        {plan && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PLAN_COLOR[plan] ?? "bg-gray-100 text-gray-600"}`}>
            Plan {PLAN_LABEL[plan] ?? plan}
          </span>
        )}
      </div>

      {/* KPI cards */}
      <SummaryCards data={resumen.data} isLoading={resumen.isLoading} />

      {/* Row 1: Canjes chart (2/3) + Top cupones (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CanjesChart data={canjes.data} isLoading={canjes.isLoading} />
        </div>
        <div>
          <TopCupones data={cupones.data} isLoading={cupones.isLoading} />
        </div>
      </div>

      {/* Row 2: Activity heatmap */}
      <ActivityHeatmap data={heatmap.data} isLoading={heatmap.isLoading} />

      {/* Row 3: Clientes nuevos + Actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ClientesNuevosChart data={clientes.data} isLoading={clientes.isLoading} />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </main>
  );
}
