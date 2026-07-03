import { useEffect, useState } from "react";
import { useInView } from "../../hooks/useInView";

const STATS = [
  { target: 500, suffix: "+", label: "negocios confían en Welve" },
  { target: 50000, suffix: "+", label: "clientes fidelizados" },
  { target: 30, suffix: "%", label: "aumento promedio en recompra" },
];

function StatNumber({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const duration = 1400;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);

  return <p className="text-4xl font-black text-welve-600 sm:text-5xl">{val.toLocaleString("es-PE")}{suffix}</p>;
}

export default function StatsSection() {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section ref={ref} className="bg-white py-16">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 px-6 text-center sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label}>
            <StatNumber target={s.target} suffix={s.suffix} active={inView} />
            <p className="mt-2 text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
