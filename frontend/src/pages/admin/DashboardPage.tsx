import { useState } from "react";
import { LayoutGrid, RotateCcw, Save, X } from "lucide-react";
import { useEmpresa } from "../../hooks/useMetricas";
import DashboardGrid, { loadLayout, saveLayout, resetLayout } from "../../components/admin/dashboard/DashboardGrid";
import type { WidgetSize } from "../../components/admin/dashboard/Widget";
import MetricasResumenWidget from "../../components/admin/dashboard/widgets/MetricasResumenWidget";
import GraficoCanjesWidget from "../../components/admin/dashboard/widgets/GraficoCanjesWidget";
import TopCuponesWidget from "../../components/admin/dashboard/widgets/TopCuponesWidget";
import CalendarioActividadWidget from "../../components/admin/dashboard/widgets/CalendarioActividadWidget";
import ActividadRecienteWidget from "../../components/admin/dashboard/widgets/ActividadRecienteWidget";
import AlertasStockWidget from "../../components/admin/dashboard/widgets/AlertasStockWidget";
import ClientesNuevosWidget from "../../components/admin/dashboard/widgets/ClientesNuevosWidget";
import ResumenVentasWidget from "../../components/admin/dashboard/widgets/ResumenVentasWidget";
import OnboardingTutorial, { onboardingCompletado } from "../../components/admin/OnboardingTutorial";

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter", growth: "Growth", pro: "Pro",
  basico: "Básico", profesional: "Profesional", enterprise: "Enterprise",
};
const PLAN_COLOR: Record<string, string> = {
  starter: "bg-gray-100 text-gray-600", growth: "bg-welve-100 text-welve-700", pro: "bg-amber-100 text-amber-700",
  basico: "bg-gray-100 text-gray-600", profesional: "bg-welve-100 text-welve-700", enterprise: "bg-amber-100 text-amber-700",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function fmtDate(): string {
  return new Date().toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

const WIDGET_REGISTRY: Record<string, { size: WidgetSize; Component: React.ComponentType<{ editMode: boolean }> }> = {
  metricas_resumen:     { size: "xl", Component: MetricasResumenWidget },
  grafico_canjes:       { size: "lg", Component: GraficoCanjesWidget },
  top_cupones:          { size: "sm", Component: TopCuponesWidget },
  calendario_actividad: { size: "xl", Component: CalendarioActividadWidget },
  actividad_reciente:   { size: "md", Component: ActividadRecienteWidget },
  alertas_stock:        { size: "md", Component: AlertasStockWidget },
  clientes_nuevos:      { size: "md", Component: ClientesNuevosWidget },
  resumen_ventas:       { size: "md", Component: ResumenVentasWidget },
};

const DEFAULT_ORDER = [
  "metricas_resumen",
  "grafico_canjes", "top_cupones",
  "calendario_actividad",
  "actividad_reciente", "alertas_stock",
  "clientes_nuevos", "resumen_ventas",
];

const SIZES: Record<string, WidgetSize> = Object.fromEntries(
  Object.entries(WIDGET_REGISTRY).map(([id, w]) => [id, w.size]),
);

export default function DashboardPage() {
  const empresa = useEmpresa();
  const plan = empresa.data?.planSuscripcion ?? "";

  const [savedOrder, setSavedOrder] = useState(() => loadLayout(DEFAULT_ORDER));
  const [editMode, setEditMode] = useState(false);
  const [draftOrder, setDraftOrder] = useState(savedOrder);
  const [showOnboarding, setShowOnboarding] = useState(() => !onboardingCompletado());

  function empezarEdicion() {
    setDraftOrder(savedOrder);
    setEditMode(true);
  }
  function guardar() {
    saveLayout(draftOrder);
    setSavedOrder(draftOrder);
    setEditMode(false);
  }
  function cancelar() {
    setEditMode(false);
  }
  function resetear() {
    resetLayout();
    setSavedOrder(DEFAULT_ORDER);
    setDraftOrder(DEFAULT_ORDER);
  }

  return (
    <main className="max-w-[1600px] space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 animate-fade-up">
        <div>
          <p className="text-xs capitalize text-gray-400">{fmtDate()}</p>
          <h1 className="mt-0.5 text-xl font-bold text-gray-900">{greeting()}, {empresa.data?.nombre ?? "—"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {plan && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PLAN_COLOR[plan] ?? "bg-gray-100 text-gray-600"}`}>
              Plan {PLAN_LABEL[plan] ?? plan}
            </span>
          )}
          {!editMode && (
            <button
              onClick={empezarEdicion}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-welve-300 hover:text-welve-600"
            >
              <LayoutGrid size={14} /> Personalizar dashboard
            </button>
          )}
        </div>
      </div>

      {editMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 animate-fade-up">
          <span>Modo edición — arrastra los widgets para reorganizar</span>
          <div className="flex items-center gap-2">
            <button onClick={resetear} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-100">
              <RotateCcw size={13} /> Resetear layout
            </button>
            <button onClick={cancelar} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm hover:bg-gray-50">
              <X size={13} /> Cancelar
            </button>
            <button onClick={guardar} className="flex items-center gap-1.5 rounded-lg bg-welve-500 px-3 py-1.5 text-xs text-white hover:bg-welve-600">
              <Save size={13} /> Guardar layout
            </button>
          </div>
        </div>
      )}

      <DashboardGrid
        order={editMode ? draftOrder : savedOrder}
        sizes={SIZES}
        editMode={editMode}
        onReorder={setDraftOrder}
        renderWidget={(id, em) => {
          const entry = WIDGET_REGISTRY[id];
          if (!entry) return null;
          const { Component } = entry;
          return <Component editMode={em} />;
        }}
      />

      {showOnboarding && (
        <OnboardingTutorial empresaNombre={empresa.data?.nombre ?? ""} onDone={() => setShowOnboarding(false)} />
      )}
    </main>
  );
}
