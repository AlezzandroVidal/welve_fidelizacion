import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Ticket } from 'lucide-react';
import type { CuponDetalle } from '../../../api/wallet';

const GRADIENTE_TIPO: Record<string, string> = {
  porcentual: 'from-blue-500 to-indigo-600',
  monto_fijo: 'from-emerald-400 to-teal-500',
  producto_gratis: 'from-orange-400 to-rose-500',
  dos_por_uno: 'from-purple-500 to-pink-500',
  n_por_m: 'from-purple-500 to-pink-500',
  envio_gratis: 'from-sky-400 to-blue-500',
  personalizado: 'from-gray-500 to-gray-700',
};

const TIPO_LABEL: Record<string, string> = {
  porcentual: 'Descuento %',
  monto_fijo: 'Descuento fijo',
  producto_gratis: 'Producto gratis',
  dos_por_uno: '2x1',
  n_por_m: 'NxM',
  envio_gratis: 'Envío gratis',
  personalizado: 'Promoción especial',
};

interface Props {
  cupon: CuponDetalle;
  onCompartir: () => void;
}

export default function CuponHero({ cupon, onCompartir }: Props) {
  const navigate = useNavigate();
  const sinImagenNiColor = !cupon.imagenUrl && !cupon.colorTema;

  // Acceso directo (deep link compartido, sin historial propio en esta pestaña)
  // no debe dejar al usuario sin forma de volver — cae a /wallet en ese caso.
  const volver = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/wallet');
  };

  return (
    <div
      className={`relative h-[250px] w-full overflow-hidden ${
        sinImagenNiColor ? `bg-gradient-to-br ${GRADIENTE_TIPO[cupon.tipo] ?? GRADIENTE_TIPO.dos_por_uno}` : ''
      }`}
      style={cupon.colorTema && !cupon.imagenUrl ? { backgroundColor: cupon.colorTema } : undefined}
    >
      {cupon.imagenUrl && (
        <img
          src={cupon.imagenUrl}
          alt={cupon.nombre}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {sinImagenNiColor && (
        <Ticket size={200} strokeWidth={1.25} className="pointer-events-none absolute -right-10 -top-10 rotate-12 text-white opacity-[0.12]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
        <button
          onClick={volver}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm backdrop-blur transition-transform active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={onCompartir}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm backdrop-blur transition-transform active:scale-95"
        >
          <Share2 size={18} />
        </button>
      </div>

      <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-800 backdrop-blur">
        {TIPO_LABEL[cupon.tipo] ?? cupon.tipo}
      </span>
    </div>
  );
}
