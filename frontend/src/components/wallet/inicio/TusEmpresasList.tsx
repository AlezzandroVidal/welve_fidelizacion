import { useNavigate } from 'react-router-dom';
import { Flame } from 'lucide-react';

export default function TusEmpresasList({ empresas }: { empresas: any[] }) {
  const navigate = useNavigate();
  if (empresas.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-4 px-1 text-lg font-bold text-gray-800">Tus empresas</h2>
      <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
        {empresas.map((e: any) => (
          <div
            key={e.id}
            onClick={() => navigate(`/wallet/empresa/${e.id}`)}
            className="flex min-w-[220px] max-w-[220px] flex-shrink-0 cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-transform active:scale-[0.98]"
          >
            {e.logo_url ? (
              <img src={e.logo_url} alt={e.nombre} className="h-11 w-11 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-welve-100 font-bold text-welve-600">
                {e.nombre.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-gray-800">{e.nombre}</h3>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                {e.mi_relacion?.racha_actual > 0 && (
                  <span className="flex items-center gap-0.5 font-semibold text-orange-500">
                    <Flame size={11} fill="currentColor" /> {e.mi_relacion.racha_actual}
                  </span>
                )}
                {e.cupon_destacado && <span className="truncate">{e.cupon_destacado.nombre}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
