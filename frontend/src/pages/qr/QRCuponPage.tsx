import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Ban, CheckCircle2, XCircle } from "lucide-react";
import { useCupon } from "../../hooks/useCupones";
import { useCliente } from "../../hooks/useClientes";
import { useValidarCupon } from "../../hooks/useQR";
import { TIPO_LABEL } from "../../components/admin/cupones/badges";

type Estado = "listo" | "exito" | "error";

export default function QRCuponPage() {
  const { cuponId } = useParams<{ cuponId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clienteId = searchParams.get("cliente");

  const { data: cupon, isLoading: loadingCupon } = useCupon(cuponId ?? null);
  const { data: cliente, isLoading: loadingCliente } = useCliente(clienteId);
  const validar = useValidarCupon();

  const [estado, setEstado] = useState<Estado>("listo");
  const [errorMsg, setErrorMsg] = useState("");
  const [ultimoCanje, setUltimoCanje] = useState<{ cliente: string; cupon: string; hora: string } | null>(null);

  async function handleConfirmar() {
    if (!cuponId || !clienteId) return;
    try {
      const res = await validar.mutateAsync({ cuponId, clienteId });
      setUltimoCanje({
        cliente: cliente?.nombre ?? "Cliente",
        cupon: cupon?.nombre ?? "Cupón",
        hora: new Date(res.canje.fecha).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      });
      setEstado("exito");
    } catch (e) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErrorMsg(msg ?? "No se pudo validar el canje.");
      setEstado("error");
    }
  }

  if (!cuponId || !clienteId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-center">
        <p className="text-red-500">QR inválido — falta información del cupón o del cliente.</p>
      </div>
    );
  }

  // ESTADO 1 — Cargando
  if (loadingCupon || loadingCliente) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-welve-200 border-t-welve-500" />
        <p className="text-gray-500">Cargando cupón y cliente…</p>
      </div>
    );
  }

  if (!cupon || !cliente) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-center">
        <p className="text-red-500">No se encontró el cupón o el cliente en tu empresa.</p>
      </div>
    );
  }

  // ESTADO 4 — Error
  if (estado === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-full max-w-sm animate-fade-up rounded-[24px] bg-white p-8 shadow-xl">
          <XCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h1 className="mb-1 text-lg font-bold text-gray-900">No se pudo validar</h1>
          <p className="mb-6 text-sm text-gray-500">{errorMsg}</p>
          <button
            onClick={() => setEstado("listo")}
            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-bold text-white transition-transform active:scale-95"
          >
            Volver a intentar
          </button>
        </div>
      </div>
    );
  }

  // ESTADO 3 — Canje exitoso
  if (estado === "exito" && ultimoCanje) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-full max-w-sm animate-scale-in rounded-[24px] bg-white p-8 shadow-xl">
          <CheckCircle2 size={52} className="mx-auto mb-4 text-green-500" />
          <h1 className="mb-1 text-lg font-bold text-gray-900">Canje registrado exitosamente</h1>
          <div className="my-4 space-y-1 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-800">{ultimoCanje.cliente}</p>
            <p>{ultimoCanje.cupon}</p>
            <p className="text-xs text-gray-400">{ultimoCanje.hora}</p>
          </div>
          <button
            onClick={() => setEstado("listo")}
            className="w-full rounded-xl bg-welve-500 py-3 text-sm font-bold text-white transition-transform active:scale-95"
          >
            Nuevo canje
          </button>
        </div>
      </div>
    );
  }

  // ESTADO 2 — Listo para validar
  const requiereVip = cupon.exclusivo && cliente.segmento !== "exclusivo";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-xl">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
          Validar canje
        </p>

        <div className="mb-4 rounded-xl bg-welve-50 p-4">
          <p className="text-xs font-semibold text-welve-600">{TIPO_LABEL[cupon.tipo]}</p>
          <p className="text-lg font-bold text-gray-900">{cupon.nombre}</p>
          {cupon.valor !== null && (
            <p className="mt-1 text-2xl font-black text-welve-700">
              {cupon.tipo === "descuento_porcentual" ? `${cupon.valor}%` : `S/ ${cupon.valor}`}
            </p>
          )}
        </div>

        <div className="mb-4 rounded-xl bg-gray-50 p-4 text-sm">
          <p className="font-semibold text-gray-800">{cliente.nombre}</p>
          <p className="text-gray-500">
            {cliente.visitasTotales} visitas · {cliente.segmento === "exclusivo" ? "Cliente VIP" : "Cliente regular"}
          </p>
        </div>

        {requiereVip && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            ⚠️ Este cupón es exclusivo — verifica que el cliente sea VIP
          </p>
        )}
        {!cupon.estaVigente && (
          <p className="mb-4 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            <Ban size={13} /> Este cupón no está vigente
          </p>
        )}

        <div className="space-y-2">
          <button
            onClick={handleConfirmar}
            disabled={validar.isPending}
            className="w-full rounded-xl bg-green-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-500/30 transition-transform active:scale-95 disabled:opacity-60"
          >
            {validar.isPending ? "Validando..." : "✓ Confirmar canje"}
          </button>
          <button
            onClick={() => navigate("/admin/canjes")}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
