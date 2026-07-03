import { useMemo, useState } from 'react';
import { useCupones, useCuponesDesbloqueados } from '../../hooks/useWallet';
import TabDisponibles from '../../components/wallet/miscupones/TabDisponibles';
import TabDesbloqueados from '../../components/wallet/miscupones/TabDesbloqueados';
import TabEnProgreso from '../../components/wallet/miscupones/TabEnProgreso';
import TabHistorialCanjes from '../../components/wallet/miscupones/TabHistorialCanjes';
import CuponQRModal from '../../components/wallet/CuponQRModal';

const TABS = [
  { id: 'disponibles', label: 'Disponibles' },
  { id: 'desbloqueados', label: 'Desbloqueados' },
  { id: 'en_progreso', label: 'En progreso' },
  { id: 'historial', label: 'Usados' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function filtrarPorEstado(
  agrupados: Record<string, { empresa: any; cupones: any[] }> | undefined,
  estados: string[],
) {
  const resultado: Record<string, { empresa: any; cupones: any[] }> = {};
  for (const [empresaId, data] of Object.entries(agrupados ?? {})) {
    const cupones = data.cupones.filter((c) => estados.includes(c.acceso?.estado));
    if (cupones.length > 0) resultado[empresaId] = { empresa: data.empresa, cupones };
  }
  return resultado;
}

export default function MisCuponesPage() {
  const { data: cupones, isLoading } = useCupones();
  const { data: desbloqueados = [] } = useCuponesDesbloqueados();
  const [tab, setTab] = useState<TabId>('disponibles');
  const [qrCupon, setQrCupon] = useState<any | null>(null);

  const disponibles = useMemo(() => filtrarPorEstado(cupones, ['disponible']), [cupones]);
  const enProgreso  = useMemo(() => filtrarPorEstado(cupones, ['en_progreso']), [cupones]);

  const counts: Record<TabId, number> = {
    disponibles:   Object.values(disponibles).reduce((acc, d) => acc + d.cupones.length, 0),
    desbloqueados: desbloqueados.length,
    en_progreso:   Object.values(enProgreso).reduce((acc, d) => acc + d.cupones.length, 0),
    historial:     0,
  };

  if (isLoading) {
    return <div className="p-6 text-center animate-pulse">Cargando cupones...</div>;
  }

  return (
    <div className="p-6 pb-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Mis Cupones</h1>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-sm scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold transition-colors ${
              tab === t.id ? 'bg-welve-100 text-welve-700' : 'text-gray-500'
            }`}
          >
            {t.label}{counts[t.id] > 0 ? ` (${counts[t.id]})` : ''}
          </button>
        ))}
      </div>

      {tab === 'disponibles'   && <TabDisponibles agrupados={disponibles} onVerQR={setQrCupon} />}
      {tab === 'desbloqueados' && <TabDesbloqueados cupones={desbloqueados as any[]} onVerQR={setQrCupon} />}
      {tab === 'en_progreso'   && <TabEnProgreso agrupados={enProgreso} />}
      {tab === 'historial'     && <TabHistorialCanjes />}

      {qrCupon && <CuponQRModal cupon={qrCupon} onClose={() => setQrCupon(null)} />}
    </div>
  );
}
