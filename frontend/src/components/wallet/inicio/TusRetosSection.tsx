import { Link } from "react-router-dom";
import { useMisRetos } from "../../../hooks/useMisRetos";

export default function TusRetosSection() {
  const { data: empresas = [] } = useMisRetos();
  const retos = empresas.flatMap((e) =>
    e.retos.filter((r) => !r.completado).map((r) => ({ ...r, empresaNombre: e.empresa.nombre })));

  if (!retos.length) return null;

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-gray-800">Tus retos</h2>
        <Link to="/wallet/mis-retos" className="text-sm font-semibold text-welve-600">Ver todos</Link>
      </div>
      <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-4 scrollbar-hide">
        {retos.map((r) => (
          <Link
            key={r.reto.id}
            to="/wallet/mis-retos"
            className="w-52 flex-shrink-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <p className="truncate text-sm font-bold text-gray-800">{r.reto.nombre}</p>
            <p className="mb-2 truncate text-[11px] text-gray-400">{r.empresaNombre}</p>
            <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-welve-500" style={{ width: `${Math.min(r.porcentaje, 100)}%` }} />
            </div>
            <p className="text-[10px] font-semibold text-gray-400">{r.dias_restantes} días restantes</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
