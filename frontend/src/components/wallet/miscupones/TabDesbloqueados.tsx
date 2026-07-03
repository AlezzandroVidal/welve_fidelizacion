import { Gift } from "lucide-react";
import CuponCard from "../CuponCard";

interface Props {
  cupones: any[];
  onVerQR: (cupon: any) => void;
}

/** Cupones que el cliente desbloqueó (por_reto/por_requisito/privado) pero
 * aún no canjeó — ya vienen ordenados por fecha de expiración asc desde
 * GET /wallet/cupones/desbloqueados. */
export default function TabDesbloqueados({ cupones, onVerQR }: Props) {
  if (cupones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-welve-100">
          <Gift size={40} className="text-welve-500" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">Nada desbloqueado todavía</h2>
        <p className="max-w-[260px] text-gray-500">
          Completa retos o cumple los requisitos de cada negocio para ganar beneficios.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-welve-500 to-welve-600 p-4 text-white shadow-sm">
        <span className="text-2xl">🎁</span>
        <p className="text-sm font-bold">¡Ganaste estos beneficios!</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cupones.map((c) => (
          <CuponCard key={c.id ?? c._id} cupon={c} onVerQR={onVerQR} />
        ))}
      </div>
    </div>
  );
}
