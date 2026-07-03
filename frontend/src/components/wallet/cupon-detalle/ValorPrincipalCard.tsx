import type { CuponDetalle } from '../../../api/wallet';

function formatValor(cupon: CuponDetalle): string {
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

function estadoInfo(cupon: CuponDetalle): { label: string; color: string } {
  if (!cupon.estaVigente) return { label: 'Expirado', color: 'bg-gray-100 text-gray-500' };
  const dias = Math.ceil((new Date(cupon.fechaExpiracion).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (dias <= 7) return { label: 'Expira pronto', color: 'bg-amber-100 text-amber-700' };
  return { label: 'Activo', color: 'bg-emerald-100 text-emerald-700' };
}

export default function ValorPrincipalCard({ cupon }: { cupon: CuponDetalle }) {
  const estado = estadoInfo(cupon);
  return (
    <div className="relative z-10 -mt-10 mx-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="mb-2 text-4xl font-black leading-none text-welve-600">{formatValor(cupon)}</p>
          <h1 className="text-lg font-bold text-gray-900">{cupon.nombre}</h1>
          {cupon.montoMinimo != null && cupon.montoMinimo > 0 && (
            <p className="mt-1 text-xs text-gray-500">Compra mínima S/{cupon.montoMinimo}</p>
          )}
        </div>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${estado.color}`}>
          {estado.label}
        </span>
      </div>
    </div>
  );
}
