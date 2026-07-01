import { useState } from "react";
import { ChevronDown, Ticket } from "lucide-react";
import { useCupones } from "../../../hooks/useCupones";
import { TIPO_LABEL } from "../cupones/badges";
import QRDisplay from "../QRDisplay";

export default function CuponesQRList() {
  const { data: cupones = [] } = useCupones("activo");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-card border border-dashed border-welve-200 bg-white p-6 shadow-card">
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-900">QR por cupón</h2>
        <p className="mt-0.5 max-w-md text-xs text-gray-500">
          Cada cupón tiene su propio QR. El cliente lo muestra en su pantalla y tú lo escaneas
          para validar el canje.
        </p>
      </div>

      {!cupones.length ? (
        <p className="py-6 text-center text-sm text-gray-400">Sin cupones activos aún</p>
      ) : (
        <div className="space-y-2">
          {cupones.map((c) => {
            const open = expandedId === c.id;
            return (
              <div key={c.id} className="overflow-hidden rounded-xl border border-gray-100">
                <button
                  onClick={() => setExpandedId(open ? null : c.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <Ticket size={14} className="text-welve-500" />
                    <span className="text-sm font-medium text-gray-800">{c.nombre}</span>
                    <span className="rounded-md bg-welve-50 px-1.5 py-0.5 text-[10px] font-semibold text-welve-600">
                      {TIPO_LABEL[c.tipo]}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="animate-fade-up border-t border-gray-100 bg-gray-50/50 p-4">
                    <p className="mb-3 text-center text-[11px] text-gray-400">
                      El cliente debe estar logueado para que el QR incluya su ID — este código es
                      solo una vista previa del patrón. El QR real lo genera el cliente desde
                      "Mostrar QR" en su wallet.
                    </p>
                    <QRDisplay path={`/qr/cupon/${c.id}`} size="sm" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
