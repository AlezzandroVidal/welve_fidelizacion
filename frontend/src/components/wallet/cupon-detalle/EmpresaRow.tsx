import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { EmpresaResumenCupon } from '../../../api/wallet';

const RUBRO_LABEL: Record<string, string> = {
  food_beverage: 'Cafetería / Restaurante',
  belleza: 'Belleza',
  retail: 'Retail',
  otro: 'Otro',
};

export default function EmpresaRow({ empresa }: { empresa: EmpresaResumenCupon }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/wallet/empresa/${empresa.id}`)}
      className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-transform active:scale-[0.98]"
    >
      {empresa.logoUrl ? (
        <img src={empresa.logoUrl} alt={empresa.nombre} className="h-12 w-12 flex-shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-welve-100 font-bold text-welve-600">
          {empresa.nombre.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1 text-left">
        <h3 className="truncate font-bold text-gray-900">{empresa.nombre}</h3>
        <p className="text-xs text-gray-500">{RUBRO_LABEL[empresa.rubro] ?? empresa.rubro}</p>
      </div>
      <ChevronRight size={18} className="flex-shrink-0 text-gray-400" />
    </button>
  );
}
