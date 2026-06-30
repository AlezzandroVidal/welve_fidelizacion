import { useEffect, useRef, useState } from "react";
import { Users, CheckSquare, Ticket, TrendingUp } from "lucide-react";
import type { Resumen } from "../../api/metricas";

function useCountUp(target: number, duration = 700) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

function Skeleton() {
  return <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />;
}

interface CardProps {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  color: string;
  fmt?: (n: number) => string;
}

function Card({ label, value, sub, icon: Icon, color, fmt }: CardProps) {
  const count = useCountUp(value);
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: color + "18" }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 tabular-nums">
          {fmt ? fmt(count) : count.toLocaleString("es-PE")}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  );
}

interface Props {
  data: Resumen | undefined;
  isLoading: boolean;
}

export default function SummaryCards({ data, isLoading }: Props) {
  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
    </div>
  );

  const cards: CardProps[] = [
    { label: "Total clientes",    value: data?.total_clientes ?? 0,  sub: `${data?.clientes_recurrentes ?? 0} recurrentes`, icon: Users,       color: "#3B82F6" },
    { label: "Canjes este mes",   value: data?.canjes_mes ?? 0,      sub: `${data?.canjes_hoy ?? 0} hoy · ${data?.canjes_semana ?? 0} esta semana`, icon: CheckSquare, color: "#3FD17A" },
    { label: "Cupones activos",   value: data?.cupones_activos ?? 0, sub: "con estado activo",                              icon: Ticket,      color: "#7C5CFC" },
    { label: "Tasa de redención", value: data?.tasa_redencion ?? 0,  sub: `racha promedio: ${data?.racha_promedio ?? 0}`,   icon: TrendingUp,  color: "#F97316", fmt: (n) => `${n}%` },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => <Card key={c.label} {...c} />)}
    </div>
  );
}
