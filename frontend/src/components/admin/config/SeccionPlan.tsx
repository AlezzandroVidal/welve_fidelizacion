import { Crown } from "lucide-react";
import { Button } from "../../ui";

const PLAN_LABEL: Record<string, string> = { starter: "Starter", growth: "Growth", pro: "Pro", basico: "Básico", profesional: "Profesional", enterprise: "Enterprise" };
const PLAN_LIMITS: Record<string, { clientes: number; cupones: number }> = {
  starter: { clientes: 500,   cupones: 5  },
  growth:  { clientes: 2000,  cupones: 20 },
  pro:     { clientes: 10000, cupones: 100 },
};

export default function SeccionPlan({ plan }: { plan: string }) {
  const limits = PLAN_LIMITS[plan] ?? { clientes: 500, cupones: 5 };
  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-xl bg-[#1E1B2E] p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Crown size={16} className="text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Plan actual</span>
        </div>
        <p className="text-2xl font-black">{PLAN_LABEL[plan] ?? plan}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xl font-black">{limits.clientes.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Clientes</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xl font-black">{limits.cupones}</p>
            <p className="text-xs text-gray-400">Cupones activos</p>
          </div>
        </div>
      </div>
      <Button variant="secondary">Ver todos los planes</Button>
    </div>
  );
}
