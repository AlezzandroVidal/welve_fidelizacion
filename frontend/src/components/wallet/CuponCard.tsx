import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const GRADIENTE_TIPO: Record<string, string> = {
  porcentual: 'from-blue-500 to-indigo-600',
  monto_fijo: 'from-emerald-400 to-teal-500',
  producto_gratis: 'from-orange-400 to-rose-500',
  dos_por_uno: 'from-purple-500 to-pink-500',
  n_por_m: 'from-purple-500 to-pink-500',
  envio_gratis: 'from-sky-400 to-blue-500',
  personalizado: 'from-gray-500 to-gray-700',
};

function formatValor(cupon: any): { valor: string; label: string } {
  switch (cupon.tipo) {
    case 'porcentual': return { valor: `${cupon.valor}%`, label: 'OFF' };
    case 'monto_fijo': return { valor: `S/${cupon.valor}`, label: 'DSCTO' };
    case 'dos_por_uno': return { valor: '2x1', label: 'PROMO' };
    case 'n_por_m': return { valor: `${cupon.cantidadPaga ?? '?'}x${cupon.cantidadLleva ?? '?'}`, label: 'PROMO' };
    case 'envio_gratis': return { valor: 'ENVÍO', label: 'GRATIS' };
    case 'personalizado': return { valor: 'PROMO', label: 'ESPECIAL' };
    default: return { valor: 'GRATIS', label: 'REGALO' };
  }
}

interface Props {
  cupon: any;
  /** Si se pasa, muestra un botón "Ver mi QR" que abre el modal sin navegar. */
  onVerQR?: (cupon: any) => void;
}

/** Card tipo "ticket" con imagen — versión compartida entre TabCupones
 * (EmpresaDetallePage) y MisCuponesPage. El click en la card navega al
 * detalle público del cupón; solo "Ver mi QR" abre el modal de canje. */
export default function CuponCard({ cupon, onVerQR }: Props) {
  const navigate = useNavigate();
  const cuponId = cupon.id ?? cupon._id;
  const imagen = cupon.imagenUrl ?? cupon.imagen_url;
  const montoMinimo = cupon.montoMinimo ?? cupon.monto_minimo;
  const fechaExp = cupon.fechaExpiracion ?? cupon.fecha_expiracion;
  const { valor, label } = formatValor(cupon);

  return (
    <div
      onClick={() => navigate(`/wallet/cupon/${cuponId}`)}
      className={`cursor-pointer overflow-hidden rounded-3xl border bg-white shadow-sm transition-transform active:scale-[0.98] ${
        cupon.visibilidad === 'vip' ? 'border-yellow-300' : 'border-gray-100'
      }`}
    >
      <div
        className={`relative h-[150px] overflow-hidden bg-gradient-to-br p-4 text-white ${
          GRADIENTE_TIPO[cupon.tipo] ?? GRADIENTE_TIPO.dos_por_uno
        }`}
      >
        {imagen && (
          <>
            <img src={imagen} alt={cupon.nombre} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </>
        )}
        {cupon.visibilidad === 'vip' && (
          <div className="absolute top-3 right-3 z-10 rounded-md bg-yellow-400 px-2 py-1 text-[9px] font-black text-yellow-900">
            ⭐ Solo para ti
          </div>
        )}
        <div className="relative z-10">
          <span className="text-2xl font-black leading-none">{valor}</span>{' '}
          <span className="text-xs font-bold uppercase opacity-90">{label}</span>
        </div>
        {/* Efecto ticket: perforado con muescas semicirculares suaves, no
            triángulos — mask-image "muerde" círculos del borde superior de
            esta franja blanca en vez de recortar zig-zags filosos. */}
        <div
          className="absolute -bottom-1 left-0 right-0 h-4 bg-white"
          style={{
            maskImage: 'radial-gradient(circle 6px at 10px 0px, transparent 6px, black 6.5px)',
            maskSize: '20px 100%',
            maskRepeat: 'repeat-x',
            WebkitMaskImage: 'radial-gradient(circle 6px at 10px 0px, transparent 6px, black 6.5px)',
            WebkitMaskSize: '20px 100%',
            WebkitMaskRepeat: 'repeat-x',
          } as React.CSSProperties}
        />
      </div>

      <div className="p-3">
        <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-tight text-gray-800">{cupon.nombre}</h3>
        {montoMinimo > 0 && <p className="mb-2 text-[10px] text-gray-500">Min. compra S/{montoMinimo}</p>}

        <div className="flex items-center justify-between border-t border-gray-50 pt-2">
          <span className="text-[10px] text-gray-400">
            {fechaExp && `Vence ${new Date(fechaExp).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}`}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-welve-600">
            Ver detalles <ChevronRight size={11} />
          </span>
        </div>

        {onVerQR && (
          <button
            onClick={(e) => { e.stopPropagation(); onVerQR(cupon); }}
            className="mt-2 w-full rounded-full bg-gray-900 py-2 text-xs font-bold text-white transition-transform active:scale-95"
          >
            Ver mi QR
          </button>
        )}
      </div>
    </div>
  );
}
