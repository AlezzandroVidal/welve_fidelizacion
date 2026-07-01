import { Star, MessageSquare } from "lucide-react";
import { useMisResenasEmpresa } from "../../hooks/useResenas";

function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= value ? "text-amber-400" : "text-gray-200"} fill={n <= value ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function ResenasPage() {
  const { data, isLoading } = useMisResenasEmpresa();

  if (isLoading || !data) {
    return <div className="p-6 text-sm text-gray-400">Cargando reseñas...</div>;
  }

  const { resumen, resenas } = data;

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
          <Star size={20} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reseñas</h1>
          <p className="text-xs text-gray-400">Lo que opinan tus clientes</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 rounded-card bg-white p-6 shadow-card md:flex-row md:items-center">
        <div className="text-center md:w-32 md:flex-shrink-0">
          <p className="text-4xl font-black text-gray-900 tabular">{resumen.promedio || "—"}</p>
          <div className="mt-1 flex justify-center">
            <StarRow value={Math.round(resumen.promedio)} size={16} />
          </div>
          <p className="mt-1 text-xs text-gray-400">{resumen.total} reseña{resumen.total === 1 ? "" : "s"}</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((n) => {
            const count = resumen.distribucion[String(n)] ?? 0;
            const pct = resumen.total ? Math.round((count / resumen.total) * 100) : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex w-3 items-center gap-1">{n}</span>
                <Star size={11} className="text-amber-400" fill="currentColor" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right text-gray-400">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-gray-700">Historial de comentarios</h2>
        {resenas.length === 0 ? (
          <div className="rounded-card border border-dashed border-gray-200 bg-white py-16 text-center shadow-card">
            <MessageSquare className="mx-auto mb-3 text-gray-200" size={36} />
            <p className="text-sm text-gray-400">Todavía no tienes reseñas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resenas.map((r) => (
              <div key={r.id} className="rounded-card bg-white p-5 shadow-card">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {r.clienteFotoUrl ? (
                      <img src={r.clienteFotoUrl} alt={r.clienteNombre} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-welve-100 text-xs font-bold text-welve-600">
                        {initials(r.clienteNombre)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.clienteNombre}</p>
                      <p className="text-[11px] text-gray-400">{fmtFecha(r.fecha)}</p>
                    </div>
                  </div>
                  <StarRow value={r.estrellas} />
                </div>
                {r.comentario && <p className="text-sm leading-relaxed text-gray-600">{r.comentario}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
