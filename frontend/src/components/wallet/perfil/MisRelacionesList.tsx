import { useNavigate } from "react-router-dom";
import { ChevronRight, Flame, QrCode } from "lucide-react";
import type { PerfilRelacionResumen } from "../../../api/wallet";

interface Props {
  resumen: PerfilRelacionResumen[];
}

export default function MisRelacionesList({ resumen }: Props) {
  const navigate = useNavigate();

  if (resumen.length === 0) {
    return (
      <div className="mb-8 overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        Aún no tienes relación con ninguna empresa.
      </div>
    );
  }

  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      {resumen.map((res, idx) => (
        <div
          key={res.empresa.id}
          className={`flex items-center justify-between gap-2 p-4 ${idx !== resumen.length - 1 ? "border-b border-gray-50" : ""}`}
        >
          <div
            onClick={() => navigate(`/wallet/empresa/${res.empresa.id}`)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
          >
            {res.empresa.logo_url ? (
              <img src={res.empresa.logo_url} alt="logo" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-500">
                {res.empresa.nombre.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-gray-800">{res.empresa.nombre}</h3>
              <p className="text-xs text-gray-500">{res.visitas} visitas • {res.puntos} pts</p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {res.segmento === "exclusivo" && (
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-bold text-yellow-700">VIP</span>
            )}
            {res.racha > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-xs font-bold text-orange-500">
                <Flame size={12} fill="currentColor" /> {res.racha}
              </div>
            )}
            <button
              onClick={() => navigate(`/wallet/empresa/${res.empresa.id}/mi-qr`)}
              className="rounded-full bg-gray-900 p-2 text-white transition-transform active:scale-95"
              title="Ver mi código"
            >
              <QrCode size={14} />
            </button>
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </div>
      ))}
    </div>
  );
}
