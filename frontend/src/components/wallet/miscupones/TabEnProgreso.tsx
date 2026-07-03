import { Target } from "lucide-react";
import CuponProgresoCard from "../CuponProgresoCard";

interface Props {
  agrupados: Record<string, { empresa: any; cupones: any[] }>;
}

/** Cupones visibilidad=por_reto/por_requisito que el cliente puede VER pero
 * aún no puede canjear — con barra de progreso completa (no mini). */
export default function TabEnProgreso({ agrupados }: Props) {
  const entries = Object.entries(agrupados);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <Target size={40} className="text-gray-400" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">Nada en progreso</h2>
        <p className="max-w-[260px] text-gray-500">
          Los cupones que se desbloquean con retos o requisitos van a aparecer aquí con tu avance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {entries.map(([empresaId, data]) => (
        <div key={empresaId}>
          <h2 className="mb-3 px-1 text-base font-bold text-gray-900">{data.empresa.nombre}</h2>
          <div className="grid grid-cols-2 gap-3">
            {data.cupones.map((c) => (
              <CuponProgresoCard key={c.id ?? c._id} cupon={c} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
