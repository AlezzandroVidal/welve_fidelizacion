import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useEmpresaInfoQR, useAfiliar } from "../../hooks/useQR";
import VisitaResultado from "../../components/qr/VisitaResultado";
import type { ResultadoVisita } from "../../api/qr";

const RUBRO_GRADIENT: Record<string, string> = {
  food_beverage: "from-orange-400 to-yellow-400",
  belleza: "from-pink-400 to-purple-500",
  retail: "from-blue-400 to-emerald-400",
  otro: "from-gray-400 to-slate-600",
};

/**
 * QR de afiliación de la empresa (/qr/visita/:empresaId) — el cliente lo usa
 * UNA SOLA VEZ para unirse al programa. Después de afiliado, las visitas y
 * canjes los registra el staff (ver /wallet/empresa/:id/mi-qr); reescanear
 * este QR ya afiliado no vuelve a contar una visita (403 en el backend).
 */
export default function QRVisitaPage() {
  const { empresaId } = useParams<{ empresaId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const { data: info, isLoading: loadingInfo } = useEmpresaInfoQR(empresaId ?? null);
  const afiliar = useAfiliar();

  const [resultado, setResultado] = useState<ResultadoVisita | null>(null);
  const [codigoCliente, setCodigoCliente] = useState<string | null>(null);
  const [usaEmail, setUsaEmail] = useState(true);
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!empresaId || !contacto.trim()) return;
    setError("");
    try {
      const res = await afiliar.mutateAsync({
        empresaId,
        data: { nombre: nombre.trim() || "Cliente", [usaEmail ? "email" : "whatsapp"]: contacto.trim() },
      });
      login(res.accessToken);
      setCodigoCliente(res.codigoCliente);
      setResultado(res.resultado);
    } catch (e2) {
      const status = (e2 as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setError("Ya estás afiliado a esta empresa — inicia sesión para ver tu código.");
      } else {
        setError("No pudimos registrarte. Verifica tus datos e intenta de nuevo.");
      }
    }
  }

  // Cliente con sesión que reescanea el QR de afiliación: ya no se auto-registra
  // una visita nueva, solo se le recuerda dónde mostrar su código al staff.
  if (isAuthenticated && !resultado) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-welve-100 p-6 text-center">
        <div className="w-full max-w-sm animate-fade-up rounded-[28px] bg-white p-8 shadow-xl">
          <p className="mb-3 text-4xl">👋</p>
          <h1 className="mb-1 text-xl font-bold text-gray-900">Ya estás afiliado{info ? ` a ${info.nombre}` : ""}</h1>
          <p className="mb-6 text-sm text-gray-500">
            Muestra tu código al staff del local para registrar tu visita o canjear un beneficio.
          </p>
          {empresaId && (
            <button
              onClick={() => navigate(`/wallet/empresa/${empresaId}/mi-qr`)}
              className="block w-full rounded-full bg-welve-500 py-3 text-sm font-bold text-white transition-transform active:scale-95"
            >
              Ver mi código
            </button>
          )}
        </div>
      </div>
    );
  }

  // Afiliación exitosa
  if (resultado) {
    return (
      <div className="relative">
        <VisitaResultado resultado={resultado} empresaNombre={info?.nombre ?? ""} />
        {codigoCliente && (
          <div className="fixed inset-x-0 top-8 z-20 flex justify-center px-6">
            <div className="w-full max-w-sm rounded-2xl bg-white/95 p-4 text-center shadow-xl backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Tu código de cliente</p>
              <p className="mt-1 text-2xl font-black tracking-widest text-welve-700">{codigoCliente}</p>
              <p className="mt-1 text-xs text-gray-500">Guárdalo — el staff lo usará para registrar tus próximas visitas</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loadingInfo) {
    return <div className="flex min-h-screen items-center justify-center bg-welve-100 text-gray-400">Cargando…</div>;
  }
  if (!info) {
    return <div className="flex min-h-screen items-center justify-center bg-welve-100 text-red-500">Empresa no encontrada</div>;
  }

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
          <h1 className="text-xl font-black text-gray-900">Únete al programa de {info.nombre}</h1>
          <p className="mt-1 text-sm text-gray-500">Regístrate una sola vez y empieza a acumular beneficios</p>
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
            disabled={afiliar.isPending}
            className="w-full rounded-full bg-welve-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-welve-500/30 transition-transform active:scale-95 disabled:opacity-60"
          >
            {afiliar.isPending ? "Registrando..." : "Registrarme y obtener mis beneficios"}
          </button>
        </form>

        <a href="/login" className="mt-4 block text-center text-xs text-gray-400 hover:text-welve-600">
          Ya tengo cuenta, iniciar sesión
        </a>
      </div>
    </div>
  );
}
