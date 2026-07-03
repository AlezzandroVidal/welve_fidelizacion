import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Target, Compass } from "lucide-react";
import { useMisRetos } from "../../hooks/useMisRetos";
import { useCupones, useDesbloquearCupon } from "../../hooks/useWallet";
import { useToast } from "../../hooks/useToast";
import { Toaster } from "../../components/ui";
import RetoCard from "../../components/wallet/retos/RetoCard";

export default function MisRetosPage() {
  const { data: empresas = [], isLoading } = useMisRetos();
  const { data: cupones } = useCupones();
  const desbloquear = useDesbloquearCupon();
  const toast = useToast();
  const [reclamando, setReclamando] = useState<string | null>(null);

  // Cupones visibilidad=por_reto, indexados por reto_id — permite mostrar el
  // botón "Reclamar" o el badge "ya enviado" sobre cada RetoCard.
  const cuponesPorReto = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; estado: string }>();
    for (const data of Object.values(cupones ?? {})) {
      for (const c of (data as any).cupones as any[]) {
        if (c.reto_id) map.set(c.reto_id, { id: c.id ?? c._id, nombre: c.nombre, estado: c.acceso?.estado });
      }
    }
    return map;
  }, [cupones]);

  async function handleReclamar(cuponId: string) {
    setReclamando(cuponId);
    try {
      await desbloquear.mutateAsync(cuponId);
      toast.success("¡Cupón reclamado! Ya está en tu cuponera.");
    } catch {
      toast.error("No se pudo reclamar el cupón");
    } finally {
      setReclamando(null);
    }
  }

  if (isLoading) {
    return <div className="animate-pulse p-6 text-center text-sm text-gray-400">Cargando tus retos...</div>;
  }

  return (
    <div className="p-6 pb-10">
      <h1 className="text-2xl font-bold text-gray-800">Mis retos activos</h1>
      <p className="mb-6 text-sm text-gray-400">Completa retos y gana recompensas</p>

      {empresas.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-welve-50">
            <Compass size={32} className="text-welve-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600">No tienes retos activos en este momento</p>
          <p className="mt-1 max-w-[240px] text-xs text-gray-400">Visita más empresas para participar en sus programas</p>
          <Link
            to="/wallet"
            className="mt-5 rounded-xl bg-welve-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-welve-600"
          >
            Explorar empresas
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {empresas.map((e) => (
            <section key={e.empresa.id}>
              <div className="mb-3 flex items-center gap-2.5">
                {e.empresa.logo_url ? (
                  <img src={e.empresa.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-welve-100">
                    <Target size={14} className="text-welve-600" />
                  </div>
                )}
                <h2 className="font-bold text-gray-800">{e.empresa.nombre}</h2>
                <span className="text-xs text-gray-400">{e.retos.length} reto{e.retos.length === 1 ? "" : "s"} activo{e.retos.length === 1 ? "" : "s"}</span>
              </div>
              <div className="space-y-3">
                {e.retos.map((r) => {
                  const cuponPorReto = cuponesPorReto.get(r.reto.id) ?? null;
                  return (
                    <RetoCard
                      key={r.reto.id}
                      reto={{
                        id: r.reto.id,
                        nombre: r.reto.nombre,
                        condicionTipo: r.reto.condicionTipo,
                        progresoActual: r.progreso_actual,
                        meta: r.meta,
                        porcentaje: r.porcentaje,
                        completado: r.completado,
                        cuponRecompensaNombre: r.cupon_recompensa?.nombre ?? r.reto.recompensaCuponNombre ?? null,
                        diasRestantes: r.dias_restantes,
                        cuponPorReto,
                      }}
                      onReclamar={cuponPorReto ? () => handleReclamar(cuponPorReto.id) : undefined}
                      reclamando={reclamando === cuponPorReto?.id}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}
