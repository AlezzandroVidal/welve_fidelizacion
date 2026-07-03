import { useMemo } from 'react';
import { Ticket } from 'lucide-react';
import { useHistorial, useMisCupones } from '../../../hooks/useWallet';

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TabHistorialCanjes() {
  const { data: historial, isLoading } = useHistorial(1);
  const { data: misCupones } = useMisCupones();

  const limiteMap = useMemo(() => {
    const map: Record<string, number | null> = {};
    Object.values(misCupones || {}).forEach((g: any) => {
      g.cupones.forEach((c: any) => {
        map[c.id ?? c._id] = c.limite_usos_por_cliente ?? null;
      });
    });
    return map;
  }, [misCupones]);

  const usosMap = useMemo(() => {
    const map: Record<string, number> = {};
    (historial?.items || []).forEach((i: any) => {
      map[i.cupon_id] = (map[i.cupon_id] || 0) + 1;
    });
    return map;
  }, [historial]);

  if (isLoading) {
    return <div className="py-10 text-center text-sm text-gray-400 animate-pulse">Cargando historial...</div>;
  }

  const items = historial?.items || [];

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <Ticket className="mx-auto mb-3 text-gray-300" size={32} />
        <p className="text-sm font-medium text-gray-500">Aún no has canjeado ningún cupón</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item: any) => {
        const limite = limiteMap[item.cupon_id];
        const usos = usosMap[item.cupon_id] || 0;
        const restantes = limite != null ? limite - usos : null;

        return (
          <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            {item.empresa_logo ? (
              <img src={item.empresa_logo} alt={item.empresa_nombre} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-welve-100 font-bold text-welve-600">
                {item.empresa_nombre.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-bold text-gray-800">{item.cupon_nombre}</h4>
              <p className="truncate text-xs text-gray-500">
                {item.empresa_nombre} · {fmtFecha(item.fecha)}
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1">
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">Canjeado</span>
              {restantes !== null && restantes > 0 && (
                <span className="rounded-md bg-welve-50 px-2 py-0.5 text-[9px] font-bold text-welve-600">
                  Puedes canjear {restantes} vez más
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
