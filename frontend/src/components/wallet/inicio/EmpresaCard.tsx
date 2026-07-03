import { useNavigate } from 'react-router-dom';
import { Flame } from 'lucide-react';

const GRADIENTE_RUBRO: Record<string, string> = {
  food_beverage: 'from-orange-400 to-yellow-400',
  belleza: 'from-pink-400 to-purple-500',
  retail: 'from-blue-400 to-emerald-400',
};

const CATEGORIA_LABEL: Record<string, string> = {
  food_beverage: 'Cafeterías',
  belleza: 'Belleza',
  retail: 'Retail',
  otro: 'Otro',
};

export default function EmpresaCard({ empresa }: { empresa: any }) {
  const navigate = useNavigate();
  const gradiente = GRADIENTE_RUBRO[empresa.rubro] ?? 'from-gray-400 to-slate-600';
  const tags: string[] = empresa.cupon_destacado?.tags ?? [];

  return (
    <div
      onClick={() => navigate(`/wallet/empresa/${empresa.id}`)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm shadow-welve-900/5 transition-shadow hover:shadow-md"
    >
      <div className="relative h-28 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradiente}`}>
          {empresa.imagen_portada_url && (
            <img
              src={empresa.imagen_portada_url}
              loading="lazy"
              alt={empresa.nombre}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
        <div className="absolute top-2 left-2 rounded-lg bg-black/30 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-md">
          {CATEGORIA_LABEL[empresa.rubro] ?? 'Otro'}
        </div>
        {empresa.mi_relacion?.segmento === 'exclusivo' && (
          <div className="absolute top-2 right-2 rounded-lg bg-yellow-400 px-2 py-1 text-[10px] font-bold text-yellow-900 shadow-sm">
            ⭐ VIP
          </div>
        )}
        <div className="absolute -bottom-4 left-3 h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
          {empresa.logo_url ? (
            <img src={empresa.logo_url} alt={empresa.nombre} className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradiente} text-xs font-bold text-white`}>
              {empresa.nombre.charAt(0)}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3 pt-6">
        <h3 className="mb-1 line-clamp-1 text-sm font-bold leading-tight text-gray-800">{empresa.nombre}</h3>
        <p className="mb-2 line-clamp-1 flex-1 text-[11px] text-gray-500">
          {empresa.descripcion || 'Sin descripción disponible para esta empresa.'}
        </p>
        {tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-md bg-welve-50 px-1.5 py-0.5 text-[9px] font-medium text-welve-600">
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-2 text-[10px] font-medium">
          <span className="rounded-md bg-welve-50 px-2 py-1 text-welve-600">
            {empresa.total_cupones_activos} cupones
          </span>
          {empresa.mi_relacion && (
            <span className="flex items-center gap-1 text-gray-500">
              {empresa.mi_relacion.racha_actual > 0 && (
                <Flame size={11} className="text-orange-500" fill="currentColor" />
              )}
              {empresa.mi_relacion.visitas_totales} visitas
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
