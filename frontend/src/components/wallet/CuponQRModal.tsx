import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import QRDisplay from '../admin/QRDisplay';

function formatValor(cupon: any): string {
  switch (cupon.tipo) {
    case 'porcentual': return `${cupon.valor}% OFF`;
    case 'monto_fijo': return `S/${cupon.valor} OFF`;
    case 'dos_por_uno': return '2x1';
    case 'n_por_m': return 'PROMO';
    case 'envio_gratis': return 'ENVÍO GRATIS';
    case 'personalizado': return 'PROMO';
    default: return 'GRATIS';
  }
}

function diasParaVencer(fechaExpiracion: string): number {
  return Math.ceil((new Date(fechaExpiracion).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

interface Props {
  cupon: any;
  empresaNombre?: string;
  onClose: () => void;
}

/** Modal de canje compartido — consolida los que antes vivían duplicados
 * inline en EmpresaDetallePage.tsx y MisCuponesPage.tsx. */
export default function CuponQRModal({ cupon, empresaNombre, onClose }: Props) {
  const { user } = useAuth();
  const nombreEmpresa = empresaNombre ?? cupon.empresa?.nombre;
  const cuponId = cupon.id ?? cupon._id;
  const fechaExp = cupon.fechaExpiracion ?? cupon.fecha_expiracion;
  const dias = diasParaVencer(fechaExp);

  // Mantiene la pantalla encendida mientras se muestra el QR al staff.
  useEffect(() => {
    let sentinel: any;
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((s: any) => { sentinel = s; }).catch(() => {});
    }
    return () => { sentinel?.release?.(); };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-[32px] bg-white p-8 shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
        >
          <X size={18} />
        </button>

        {nombreEmpresa && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-welve-600">{nombreEmpresa}</p>
        )}
        <h2 className="mb-1 text-lg font-black text-gray-900">{cupon.nombre}</h2>
        <p className="mb-4 text-2xl font-black text-welve-600">{formatValor(cupon)}</p>

        <QRDisplay path={`/qr/cupon/${cuponId}?cliente=${user?.id ?? ''}`} size="lg" className="mx-auto mb-6" />

        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Código de canje</p>
        <div className="rounded-2xl bg-gray-100 py-3 mb-2">
          <p className="text-3xl font-mono font-black tracking-[0.2em] text-gray-800">
            {String(cuponId).slice(-6).toUpperCase()}
          </p>
        </div>
        <p className="text-xs text-gray-500">Escanea el QR o ingresa el código — muéstralo al staff</p>

        {dias <= 3 && (
          <p className="mt-4 text-xs font-bold text-red-500">⚠️ Vence en {Math.max(dias, 0)} día(s)</p>
        )}
      </div>
    </div>
  );
}
