import { useNavigate } from "react-router-dom";
import { useCupones } from "../../../hooks/useWallet";
import CuponProgresoCard from "../CuponProgresoCard";

/** "Próximos beneficios" — cupones en progreso (visibilidad por_reto/
 * por_requisito, todavía no desbloqueados) de todas las empresas. */
export default function ProximosBeneficiosSection() {
  const { data } = useCupones();
  const navigate = useNavigate();

  const enProgreso = Object.values(data ?? {}).flatMap((e: any) =>
    (e.cupones as any[])
      .filter((c) => c.acceso?.estado === "en_progreso")
      .map((c) => ({ ...c, empresaNombre: e.empresa.nombre })),
  );

  if (!enProgreso.length) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-4 px-1 text-lg font-bold text-gray-800">Próximos beneficios</h2>
      <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-4 scrollbar-hide">
        {enProgreso.map((c) => (
          <button key={c.id ?? c._id} onClick={() => navigate("/wallet/mis-retos")} className="text-left">
            <CuponProgresoCard cupon={c} empresaNombre={c.empresaNombre} size="mini" />
          </button>
        ))}
      </div>
    </div>
  );
}
