import { useNavigate } from 'react-router-dom';

const GRADIENTE_TIPO: Record<string, string> = {
  porcentual: 'from-blue-500 to-indigo-600',
  monto_fijo: 'from-emerald-400 to-teal-500',
  producto_gratis: 'from-orange-400 to-rose-500',
  dos_por_uno: 'from-purple-500 to-pink-500',
  n_por_m: 'from-purple-500 to-pink-500',
  envio_gratis: 'from-sky-400 to-blue-500',
  personalizado: 'from-gray-500 to-gray-700',
};

function formatValor(cupon: any): string {
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

interface Props {
  cupon: any;
  empresaNombre?: string;
}

/** Card horizontal compacta (imagen 80x80 + info) — reusada en "Cupones por
 * categoría" (Inicio) y en "Más de [empresa]" (detalle de cupón). Acepta
 * tanto el shape camelCase de CuponDetalle/CuponResumen como el snake_case
 * de los endpoints tipo-dict de wallet_service. */
export default function CuponCardMini({ cupon, empresaNombre }: Props) {
  const navigate = useNavigate();
  const imagen = cupon.imagenUrl ?? cupon.imagen_url;
  const nombreEmpresa = empresaNombre ?? cupon.empresa?.nombre;
  const usos = cupon.usosActuales ?? cupon.usos_actuales ?? 0;
  const fechaExp = cupon.fechaExpiracion ?? cupon.fecha_expiracion;
  const cuponId = cupon.id ?? cupon._id;

  return (
    <div
      onClick={() => navigate(`/wallet/cupon/${cuponId}`)}
      className="flex gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-2 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div
        className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden relative bg-gradient-to-br ${
          GRADIENTE_TIPO[cupon.tipo] ?? GRADIENTE_TIPO.dos_por_uno
        }`}
      >
        {imagen && (
          <img src={imagen} alt={cupon.nombre} loading="lazy" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
        <span className="text-xs font-black text-welve-600">{formatValor(cupon)}</span>
        <h4 className="text-sm font-bold text-gray-800 leading-tight line-clamp-1">{cupon.nombre}</h4>
        {nombreEmpresa && <p className="text-[11px] text-gray-500 truncate">{nombreEmpresa}</p>}
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-400">
            {fechaExp &&
              `Vence ${new Date(fechaExp).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}`}
          </span>
          {usos > 0 && (
            <span className="text-[10px] font-bold text-orange-500">🔥 {usos} canjes</span>
          )}
        </div>
      </div>
    </div>
  );
}
