import { useMemo, useState } from "react";
import { Ticket, Hourglass, Gift, History } from "lucide-react";
import { useClienteCupones } from "../../../hooks/useClientes";
import { useCanjesCliente } from "../../../hooks/useCanjes";

type Tab = "disponibles" | "en_progreso" | "desbloqueados" | "canjeados";

const TABS: { id: Tab; label: string; icon: typeof Ticket }[] = [
  { id: "disponibles", label: "Disponibles", icon: Ticket },
  { id: "en_progreso", label: "En progreso", icon: Hourglass },
  { id: "desbloqueados", label: "Desbloqueados", icon: Gift },
  { id: "canjeados", label: "Canjeados", icon: History },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

/** Pestaña "Cupones" del detalle de cliente (panel admin) — estados del
 * motor de visibilidad (acceso.estado/puede_canjear/desbloqueado_en) para
 * ESTE cliente en ESTA empresa, más el historial de canjes reales. */
export default function TabCuponesCliente({ clienteId }: { clienteId: string }) {
  const { data: cupones = [], isLoading: cargandoCupones } = useClienteCupones(clienteId);
  const { data: canjes = [], isLoading: cargandoCanjes } = useCanjesCliente(clienteId);
  const [tab, setTab] = useState<Tab>("disponibles");

  const buckets = useMemo(() => {
    const disponibles: any[] = [];
    const enProgreso: any[] = [];
    const desbloqueados: any[] = [];
    for (const c of cupones as any[]) {
      const acceso = c.acceso ?? {};
      if (acceso.estado === "en_progreso") enProgreso.push(c);
      else if (acceso.desbloqueado_en) desbloqueados.push(c);
      else if (acceso.puede_canjear) disponibles.push(c);
    }
    return { disponibles, en_progreso: enProgreso, desbloqueados };
  }, [cupones]);

  const counts: Record<Tab, number> = {
    disponibles: buckets.disponibles.length,
    en_progreso: buckets.en_progreso.length,
    desbloqueados: buckets.desbloqueados.length,
    canjeados: canjes.length,
  };

  const cargando = tab === "canjeados" ? cargandoCanjes : cargandoCupones;

  return (
    <div>
      <div className="mb-3 flex gap-1 overflow-x-auto rounded-full bg-gray-50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.id ? "bg-white text-welve-700 shadow-sm" : "text-gray-500"
            }`}
          >
            <t.icon size={12} /> {t.label} ({counts[t.id]})
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="py-6 text-center text-sm text-gray-400">Cargando...</p>
      ) : tab === "canjeados" ? (
        !canjes.length ? (
          <p className="py-6 text-center text-sm text-gray-400">Sin canjes registrados</p>
        ) : (
          <ul className="space-y-1.5">
            {canjes.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-xs">
                <span className="truncate font-medium text-gray-700">{c.cuponNombre ?? "Cupón eliminado"}</span>
                <span className="ml-2 flex-shrink-0 text-gray-400">{fmtDate(c.fecha)}</span>
              </li>
            ))}
          </ul>
        )
      ) : !buckets[tab].length ? (
        <p className="py-6 text-center text-sm text-gray-400">Nada en esta categoría</p>
      ) : (
        <ul className="space-y-1.5">
          {buckets[tab].map((c: any) => {
            const acceso = c.acceso ?? {};
            return (
              <li key={c._id ?? c.id} className="rounded-lg bg-gray-50 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="truncate text-xs font-semibold text-gray-800">{c.nombre}</span>
                  <span className="ml-2 flex-shrink-0 text-[10px] uppercase text-gray-400">{c.visibilidad}</span>
                </div>
                {tab === "en_progreso" && (
                  <div className="mt-1.5">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-welve-400" style={{ width: `${Math.min(100, acceso.progreso_porcentaje ?? 0)}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">{acceso.mensaje}</p>
                  </div>
                )}
                {tab === "desbloqueados" && acceso.desbloqueado_en && (
                  <p className="mt-0.5 text-[10px] text-gray-400">Desbloqueado el {fmtDate(acceso.desbloqueado_en)}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
