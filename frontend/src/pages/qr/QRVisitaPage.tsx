import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEmpresaInfoQR, useRegistroQR, useVisitaQR } from "../../hooks/useQR";
import VisitaResultado from "../../components/qr/VisitaResultado";
import type { ResultadoVisita } from "../../api/qr";

const RUBRO_GRADIENT: Record<string, string> = {
  food_beverage: "from-orange-400 to-yellow-400",
  belleza: "from-pink-400 to-purple-500",
  retail: "from-blue-400 to-emerald-400",
  otro: "from-gray-400 to-slate-600",
};

/**
 * Código universal de visita del negocio (/qr/visita/:empresaId).
 * Un solo QR para todos los clientes: si no tienen cuenta se registran aquí
 * mismo (y esa primera visita cuenta), si ya tienen sesión solo se suma visita.
 */
export default function QRVisitaPage() {
  const { empresaId } = useParams<{ empresaId: string }>();
  const { isAuthenticated, login } = useAuth();
  const { data: info, isLoading: loadingInfo } = useEmpresaInfoQR(empresaId ?? null);
  const registro = useRegistroQR();
  const visita = useVisitaQR();

  const [resultado, setResultado] = useState<ResultadoVisita | null>(null);
  const [usaEmail, setUsaEmail] = useState(true);
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !empresaId || resultado) return;
    visita.mutateAsync(empresaId)
      .then(setResultado)
      .catch(() => setError("No se pudo registrar tu visita. Intenta de nuevo."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, empresaId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!empresaId || !contacto.trim()) return;
    setError("");
    try {
      const res = await registro.mutateAsync({
        empresaId,
        data: { nombre: nombre.trim() || "Cliente", [usaEmail ? "email" : "whatsapp"]: contacto.trim() },
      });
      login(res.accessToken);
      setResultado(res.resultado);
    } catch {
      setError("No pudimos registrarte. Verifica tus datos e intenta de nuevo.");
    }
  }

  // ESTADO 4 — ya visitó hoy
  if (resultado?.yaRegistradoHoy) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-welve-100 p-6 text-center">
        <div className="w-full max-w-sm animate-fade-up rounded-[28px] bg-white p-8 shadow-xl">
          <p className="mb-3 text-4xl">👋</p>
          <h1 className="mb-1 text-xl font-bold text-gray-900">
            Ya registraste tu visita en {info?.nombre} hoy
          </h1>
          <p className="mb-6 text-sm text-gray-500">Vuelve mañana para sumar otra visita</p>
          <a href="/wallet" className="block rounded-full bg-welve-500 py-3 text-sm font-bold text-white transition-transform active:scale-95">
            Ver mis beneficios
          </a>
        </div>
      </div>
    );
  }

  // ESTADO 3 — resultado exitoso
  if (resultado) {
    return <VisitaResultado resultado={resultado} empresaNombre={info?.nombre ?? ""} />;
  }

  // ESTADO 2 — con sesión, registrando automáticamente (cliente ya existe en Welve)
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-welve-100 p-6 text-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-welve-200 border-t-welve-500" />
        <p className="text-gray-600">Registrando tu visita en {info?.nombre ?? "la empresa"}…</p>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (loadingInfo) {
    return <div className="flex min-h-screen items-center justify-center bg-welve-100 text-gray-400">Cargando…</div>;
  }
  if (!info) {
    return <div className="flex min-h-screen items-center justify-center bg-welve-100 text-red-500">Empresa no encontrada</div>;
  }

  // ESTADO 1 — sin sesión, cliente nuevo: se registra y su visita queda contada de una vez
  const gradiente = RUBRO_GRADIENT[info.rubro] ?? RUBRO_GRADIENT.otro;

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center bg-gradient-to-br ${gradiente} px-6 py-10`}>
      <div className="w-full max-w-sm animate-scale-in rounded-[28px] bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-white p-1 shadow-lg">
            {info.logoUrl ? (
              <img src={info.logoUrl} alt={info.nombre} className="h-full w-full rounded-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${gradiente} text-2xl font-bold text-white`}>
                {info.nombre.charAt(0)}
              </div>
            )}
          </div>
          <h1 className="text-xl font-black text-gray-900">¡Únete al programa de {info.nombre}!</h1>
          {info.totalCuponesActivos > 0 && (
            <p className="mt-1 text-sm font-semibold text-welve-600">{info.totalCuponesActivos} beneficios te esperan</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm focus:border-welve-500 focus:outline-none focus:ring-2 focus:ring-welve-500/20"
          />

          <div className="flex gap-1 rounded-full bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setUsaEmail(true)}
              className={`flex-1 rounded-full py-2 text-xs font-bold transition-colors ${usaEmail ? "bg-white text-welve-600 shadow-sm" : "text-gray-500"}`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setUsaEmail(false)}
              className={`flex-1 rounded-full py-2 text-xs font-bold transition-colors ${!usaEmail ? "bg-white text-welve-600 shadow-sm" : "text-gray-500"}`}
            >
              WhatsApp
            </button>
          </div>

          <input
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            type={usaEmail ? "email" : "tel"}
            placeholder={usaEmail ? "tu@email.com" : "+51 987654321"}
            required
            className="w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-sm focus:border-welve-500 focus:outline-none focus:ring-2 focus:ring-welve-500/20"
          />

          {error && <p className="text-center text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={registro.isPending}
            className="w-full rounded-full bg-welve-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-welve-500/30 transition-transform active:scale-95 disabled:opacity-60"
          >
            {registro.isPending ? "Registrando..." : "Registrarme y obtener mis beneficios"}
          </button>
        </form>

        <a href="/login" className="mt-4 block text-center text-xs text-gray-400 hover:text-welve-600">
          Ya tengo cuenta, iniciar sesión
        </a>
      </div>
    </div>
  );
}
