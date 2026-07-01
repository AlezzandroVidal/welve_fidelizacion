import { useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { useResenasDeEmpresa, useMiResena, useDejarResena } from "../../hooks/useResenas";

function StarRow({ value, size = 16, interactive = false, onChange }: {
  value: number; size?: number; interactive?: boolean; onChange?: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={interactive ? "cursor-pointer active:scale-90 transition-transform" : "cursor-default"}
        >
          <Star
            size={size}
            className={n <= value ? "text-amber-400" : "text-gray-200"}
            fill={n <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

interface Props {
  empresaId: string;
  puedeCalificar: boolean;
}

export default function ResenasSection({ empresaId, puedeCalificar }: Props) {
  const { data, isLoading } = useResenasDeEmpresa(empresaId);
  const { data: miResena } = useMiResena(puedeCalificar ? empresaId : null);
  const dejarResena = useDejarResena(empresaId);

  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (miResena) {
      setEstrellas(miResena.estrellas);
      setComentario(miResena.comentario ?? "");
    }
  }, [miResena]);

  async function handleEnviar() {
    if (estrellas === 0) return;
    try {
      await dejarResena.mutateAsync({ estrellas, comentario: comentario.trim() || undefined });
      setEnviado(true);
      setTimeout(() => setEnviado(false), 2000);
    } catch {
      // el toast global no está disponible acá — el botón vuelve a habilitarse solo
    }
  }

  if (isLoading || !data) return null;

  const { resumen, resenas } = data;

  return (
    <div className="mb-8">
      <h2 className="mb-4 px-1 text-lg font-bold text-gray-900">Reseñas</h2>

      <div className="mb-4 flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="text-center">
          <p className="text-3xl font-black text-gray-900 tabular">{resumen.promedio || "—"}</p>
          <StarRow value={Math.round(resumen.promedio)} size={13} />
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((n) => {
            const count = resumen.distribucion[String(n)] ?? 0;
            const pct = resumen.total ? Math.round((count / resumen.total) * 100) : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="w-2">{n}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="w-14 flex-shrink-0 text-right text-xs text-gray-400">{resumen.total} reseña{resumen.total === 1 ? "" : "s"}</p>
      </div>

      {puedeCalificar && (
        <div className="mb-4 rounded-3xl border border-welve-100 bg-welve-50/50 p-5">
          <p className="mb-2 text-sm font-bold text-gray-900">{miResena ? "Tu reseña" : "Deja tu reseña"}</p>
          <StarRow value={estrellas} size={26} interactive onChange={setEstrellas} />
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Cuéntanos tu experiencia (opcional)"
            rows={2}
            className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-welve-500 focus:outline-none focus:ring-2 focus:ring-welve-500/20"
          />
          <button
            onClick={handleEnviar}
            disabled={estrellas === 0 || dejarResena.isPending}
            className="mt-3 rounded-full bg-welve-500 px-5 py-2.5 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            {enviado ? "¡Gracias!" : dejarResena.isPending ? "Enviando..." : miResena ? "Actualizar reseña" : "Publicar reseña"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {resenas.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white py-8 text-center">
            <MessageSquare className="mx-auto mb-2 text-gray-300" size={28} />
            <p className="text-sm text-gray-400">Todavía no hay reseñas</p>
          </div>
        ) : (
          resenas.map((r) => (
            <div key={r.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-1.5 flex items-center gap-2.5">
                {r.clienteFotoUrl ? (
                  <img src={r.clienteFotoUrl} alt={r.clienteNombre} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-welve-100 text-[10px] font-bold text-welve-600">
                    {initials(r.clienteNombre)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">{r.clienteNombre}</p>
                  <p className="text-[10px] text-gray-400">{fmtFecha(r.fecha)}</p>
                </div>
                <StarRow value={r.estrellas} size={13} />
              </div>
              {r.comentario && <p className="text-sm text-gray-600 leading-relaxed">{r.comentario}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
