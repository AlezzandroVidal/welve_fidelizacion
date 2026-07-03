import { useNavigate } from 'react-router-dom';

const GRADIENTE_RUBRO: Record<string, string> = {
  food_beverage: 'from-orange-400 to-yellow-400',
  belleza: 'from-pink-400 to-purple-500',
  retail: 'from-blue-400 to-emerald-400',
};

function formatValorCupon(cupon: any): string {
  switch (cupon.tipo) {
    case 'porcentual': return `${cupon.valor}% OFF`;
    case 'monto_fijo': return `S/${cupon.valor} DSCTO`;
    case 'dos_por_uno': return '2x1';
    case 'n_por_m': return 'PROMO';
    case 'envio_gratis': return 'ENVÍO GRATIS';
    case 'personalizado': return 'PROMO';
    default: return 'GRATIS';
  }
}

export default function CuponCardDestacada({ empresa }: { empresa: any }) {
  const navigate = useNavigate();
  const cupon = empresa.cupon_destacado;
  if (!cupon) return null;
  const gradiente = GRADIENTE_RUBRO[empresa.rubro] ?? 'from-gray-400 to-slate-600';

  return (
    <div
      onClick={() => navigate(`/wallet/cupon/${cupon.id ?? cupon._id}`)}
      className="relative h-[180px] min-w-[280px] max-w-[280px] flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl shadow-sm transition-transform active:scale-[0.98]"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradiente}`}>
        {cupon.imagen_url && (
          <img
            src={cupon.imagen_url}
            loading="lazy"
            alt={cupon.nombre}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <span className="absolute top-3 right-3 rounded-full bg-yellow-400 px-2.5 py-1 text-[10px] font-black text-yellow-900 shadow-sm">
        ⭐ DESTACADO
      </span>

      <div className="absolute bottom-3 left-3 right-3">
        <span className="mb-1 block text-2xl font-black leading-none text-white drop-shadow-md">
          {formatValorCupon(cupon)}
        </span>
        <h3 className="mb-1.5 line-clamp-1 text-sm font-bold leading-tight text-white drop-shadow-md">
          {cupon.nombre}
        </h3>
        <div className="flex items-center gap-1.5">
          {empresa.logo_url ? (
            <img src={empresa.logo_url} alt={empresa.nombre} className="h-4 w-4 rounded-full object-cover ring-1 ring-white/50" />
          ) : (
            <div className="h-4 w-4 flex-shrink-0 rounded-full bg-white/30" />
          )}
          <span className="truncate text-xs text-white/90">{empresa.nombre}</span>
        </div>
      </div>
    </div>
  );
}
