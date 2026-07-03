import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMiQR } from "../../hooks/useWallet";

export default function MiQRPage() {
  const { empresaId } = useParams<{ empresaId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useMiQR(empresaId ?? "");

  // Evita que la pantalla se apague/oscurezca mientras el cliente muestra su código.
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    navigator.wakeLock?.request("screen").then((wl) => (wakeLock = wl)).catch(() => {});
    return () => {
      wakeLock?.release().catch(() => {});
    };
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-400">
        Cargando tu código…
      </div>
    );
  }

  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(data.qr_data)}`;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-white px-4 py-8 text-center sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-col items-center sm:mb-8">
        <div className="mb-3 h-14 w-14 flex-shrink-0 rounded-full bg-welve-100 p-1">
          {data.empresa.logo_url ? (
            <img src={data.empresa.logo_url} alt={data.empresa.nombre} className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-welve-500 text-lg font-bold text-white">
              {data.empresa.nombre.charAt(0)}
            </div>
          )}
        </div>
        <h1 className="text-lg font-bold text-gray-900">{data.empresa.nombre}</h1>
      </div>

      <div className="mb-6 w-full max-w-[280px] rounded-[28px] border-2 border-dashed border-welve-200 p-4 shadow-xl">
        <img src={qrImgSrc} alt="Tu código QR" className="aspect-square w-full rounded-xl" />
      </div>

      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Tu código</p>
      <p className="mb-6 break-all text-3xl font-black tracking-[0.15em] text-welve-700 sm:text-4xl">{data.codigo_cliente}</p>

      <p className="mb-10 max-w-xs text-sm text-gray-500">
        Muestra este código al staff para registrar tu visita o canjear un beneficio.
      </p>

      <button
        onClick={() => navigate(-1)}
        className="mt-auto flex items-center gap-2 rounded-full bg-gray-100 px-6 py-3 text-sm font-bold text-gray-700 transition-transform active:scale-95"
      >
        <ArrowLeft size={16} />
        Volver
      </button>
    </div>
  );
}
