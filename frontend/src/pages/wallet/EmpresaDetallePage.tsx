import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useEmpresaDetalle } from '../../hooks/useWallet';
import { useAuth } from '../../context/AuthContext';
import EmpresaHero from '../../components/wallet/empresa/EmpresaHero';
import TabCupones from '../../components/wallet/empresa/TabCupones';
import RetoCard, { type RetoCardData } from '../../components/wallet/retos/RetoCard';
import RetoDetalleSheet from '../../components/wallet/retos/RetoDetalleSheet';
import TabInfo from '../../components/wallet/empresa/TabInfo';
import ResenasSection from '../../components/wallet/ResenasSection';
import CuponQRModal from '../../components/wallet/CuponQRModal';

const TABS = [
  { id: 'cupones', label: 'Cupones' },
  { id: 'retos', label: 'Retos' },
  { id: 'info', label: 'Info' },
  { id: 'resenas', label: 'Reseñas' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function EmpresaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useEmpresaDetalle(id || '');
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<TabId>('cupones');
  const [qrCupon, setQrCupon] = useState<any | null>(null);
  const [detalle, setDetalle] = useState<RetoCardData | null>(null);

  if (isLoading || !data) {
    return <div className="p-6 text-center animate-pulse">Cargando empresa...</div>;
  }

  const { empresa, cupones, mi_relacion, retos_activos, membresias_disponibles, mi_membresia } = data;

  const cuponPorId = new Map<string, any>((cupones || []).map((c: any) => [String(c._id ?? c.id), c]));
  const retosData: RetoCardData[] = (retos_activos || []).map((r: any) => {
    const cuponId = r.recompensa_cupon_id ? String(r.recompensa_cupon_id) : null;
    const diasRestantes = Math.max(0, Math.ceil((new Date(r.fecha_fin).getTime() - Date.now()) / 86_400_000));
    return {
      id: String(r._id ?? r.id),
      nombre: r.nombre,
      condicionTipo: r.condicion_tipo,
      periodoDias: r.periodo_dias ?? null,
      progresoActual: r.progreso_actual,
      meta: r.condicion_valor,
      porcentaje: r.porcentaje,
      completado: r.progreso_actual >= r.condicion_valor,
      cuponRecompensaNombre: cuponId ? (cuponPorId.get(cuponId)?.nombre ?? null) : null,
      cuponRecompensa: r.cupon_recompensa ?? null,
      diasRestantes,
      empresaNombre: empresa.nombre,
    };
  });

  return (
    <div className="relative min-h-screen bg-welve-100 pb-10">
      <EmpresaHero empresa={empresa} empresaId={id || ''} isAuthenticated={isAuthenticated} />

      <div className="sticky top-0 z-20 mt-6 bg-welve-100/95 px-6 py-3 backdrop-blur">
        <div className="flex gap-1 rounded-full bg-white p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
                tab === t.id ? 'bg-welve-100 text-welve-700' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">
        {tab === 'cupones' && (
          <TabCupones cupones={cupones} miRelacion={mi_relacion} onVerQR={setQrCupon} />
        )}
        {tab === 'retos' && (
          <div className="space-y-3">
            {!isAuthenticated && retosData.length > 0 && (
              <div className="flex items-center gap-2 rounded-2xl border border-welve-100 bg-welve-50 px-4 py-3 text-xs font-semibold text-welve-700">
                <LogIn size={14} className="flex-shrink-0" />
                Inicia sesión para ver tu progreso en estos retos
              </div>
            )}
            {retosData.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No hay desafíos activos por ahora</p>
            ) : (
              retosData.map((r) => (
                <RetoCard key={r.id} reto={r} onVerDetalle={() => setDetalle(r)} />
              ))
            )}
          </div>
        )}
        {tab === 'info' && (
          <TabInfo
            empresa={empresa}
            membresiasDisponibles={membresias_disponibles || []}
            miMembresia={mi_membresia}
          />
        )}
        {tab === 'resenas' && id && (
          isAuthenticated ? (
            <ResenasSection empresaId={id} puedeCalificar={!!mi_relacion} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-gray-500">Inicia sesión para ver y dejar reseñas</p>
              <a href={`/login?redirect=/wallet/empresa/${id}`} className="rounded-xl bg-welve-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-welve-600">
                Iniciar sesión
              </a>
            </div>
          )
        )}
      </div>

      <RetoDetalleSheet reto={detalle} onClose={() => setDetalle(null)} />

      {qrCupon && (
        <CuponQRModal cupon={qrCupon} empresaNombre={empresa.nombre} onClose={() => setQrCupon(null)} />
      )}
    </div>
  );
}
