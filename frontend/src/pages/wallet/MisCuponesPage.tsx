import { useEffect, useState } from 'react';
import { useMisCupones } from '../../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import { QrCode, Ticket, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import QRDisplay from '../../components/admin/QRDisplay';

function diasParaVencer(fechaExpiracion: string): number {
  const ms = new Date(fechaExpiracion).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function MisCuponesPage() {
  const { data: agrupados, isLoading } = useMisCupones();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('todas');
  const [qrCupon, setQrCupon] = useState<any | null>(null);

  // Mantiene la pantalla encendida mientras se muestra el QR al staff (si el navegador lo soporta)
  useEffect(() => {
    if (!qrCupon || !('wakeLock' in navigator)) return;
    let sentinel: any;
    (navigator as any).wakeLock.request('screen').then((s: any) => { sentinel = s; }).catch(() => {});
    return () => { sentinel?.release?.(); };
  }, [qrCupon]);

  if (isLoading) {
    return <div className="p-6 text-center animate-pulse">Cargando cupones...</div>;
  }

  const entries = agrupados ? Object.entries(agrupados) : [];
  
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 bg-welve-100 rounded-full flex items-center justify-center mb-6">
          <Ticket size={40} className="text-welve-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Aún no tienes cupones</h2>
        <p className="text-gray-500 mb-8 max-w-[260px]">Visita tus lugares favoritos y completa retos para ganar beneficios exclusivos.</p>
        <button 
          onClick={() => navigate('/wallet')}
          className="bg-welve-600 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-welve-600/30 active:scale-95 transition-transform"
        >
          Explorar empresas
        </button>
      </div>
    );
  }

  const allCupones = entries.flatMap(([_id, data]: any) => 
    data.cupones.map((c: any) => ({ ...c, empresa: data.empresa }))
  );
  
  const displayCupones = activeTab === 'todas' 
    ? allCupones 
    : (entries.find(([id]: any) => id === activeTab) as any)?.[1]?.cupones?.map((c: any) => ({
        ...c, empresa: (entries.find(([id]: any) => id === activeTab) as any)?.[1]?.empresa
      })) || [];

  return (
    <div className="p-6 pb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis Cupones</h1>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 mb-2">
        <button
          onClick={() => setActiveTab('todas')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'todas' 
              ? 'bg-welve-600 text-white shadow-md' 
              : 'bg-white text-gray-600 border border-gray-100'
          }`}
        >
          Todas
        </button>
        {entries.map(([empresaId, data]: any) => (
          <button
            key={empresaId}
            onClick={() => setActiveTab(empresaId)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === empresaId
                ? 'bg-welve-600 text-white shadow-md' 
                : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            {data.empresa.nombre}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {displayCupones.map((cupon: any) => (
          <div 
            key={cupon.id || cupon._id}
            onClick={() => navigate(`/wallet/empresa/${cupon.empresa.id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex h-28 relative cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className={`w-24 flex flex-col items-center justify-center border-r border-dashed border-gray-200 text-white relative ${
              cupon.tipo === 'descuento_porcentual' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
              cupon.tipo === 'descuento_fijo' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' :
              cupon.tipo === 'producto_gratis' ? 'bg-gradient-to-br from-orange-400 to-rose-500' :
              'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {/* Recortes ticket */}
              <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-welve-100" />
              <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-welve-100" />
              
              <span className="text-2xl font-black leading-none mb-1">
                {cupon.tipo === 'descuento_porcentual' ? `${cupon.valor}%` :
                 cupon.tipo === 'descuento_fijo' ? `S/${cupon.valor}` :
                 cupon.tipo === 'dos_por_uno' ? '2x1' : 'GRATIS'}
              </span>
              <span className="text-[9px] font-medium uppercase tracking-wider opacity-90">
                {cupon.tipo === 'descuento_porcentual' ? 'OFF' :
                 cupon.tipo === 'descuento_fijo' ? 'DSCTO' :
                 cupon.tipo === 'dos_por_uno' ? 'PROMO' : 'REGALO'}
              </span>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-center">
              {cupon.exclusivo && (
                <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md self-start mb-1 border border-yellow-100">
                  ⭐ EXCLUSIVO
                </span>
              )}
              <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">
                {cupon.nombre}
              </h3>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <span className="font-semibold text-welve-600">{cupon.empresa.nombre}</span>
              </p>
              <div className="mt-auto flex items-center justify-between gap-2">
                <p className="text-[10px] text-gray-400">
                  {diasParaVencer(cupon.fecha_expiracion) <= 3 ? (
                    <span className="font-bold text-red-500">
                      Vence en {Math.max(diasParaVencer(cupon.fecha_expiracion), 0)} día(s)
                    </span>
                  ) : (
                    <>Expira: {new Date(cupon.fecha_expiracion).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</>
                  )}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); setQrCupon(cupon); }}
                  className="flex items-center gap-1 rounded-full bg-gray-900 px-2.5 py-1 text-[10px] font-bold text-white active:scale-95 transition-transform"
                >
                  <QrCode size={11} /> Mostrar QR
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal fullscreen — QR del cupón para que el staff lo escanee */}
      {qrCupon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setQrCupon(null)}
          />
          <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-[32px] bg-white p-8 shadow-2xl text-center">
            <button
              onClick={() => setQrCupon(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <X size={18} />
            </button>
            <h2 className="mb-1 text-lg font-black text-gray-900">{qrCupon.nombre}</h2>
            <p className="mb-6 text-sm text-gray-500">Muestra este código al staff para canjear tu beneficio</p>
            <QRDisplay
              path={`/qr/cupon/${qrCupon.id ?? qrCupon._id}?cliente=${user?.id ?? ''}`}
              size="lg"
              className="mx-auto"
            />
            {diasParaVencer(qrCupon.fecha_expiracion) <= 3 && (
              <p className="mt-4 text-xs font-bold text-red-500">
                ⚠️ Vence en {Math.max(diasParaVencer(qrCupon.fecha_expiracion), 0)} día(s)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
