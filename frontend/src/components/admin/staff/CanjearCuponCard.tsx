import { FormEvent, useState } from "react";
import { Search, Ticket } from "lucide-react";
import { useClientePorCodigo, useClientePorQR, useCanjePorCodigo, useCanjePorQR } from "../../../hooks/useStaff";
import { TIPO_LABEL } from "../cupones/badges";
import type { Cupon } from "../../../api/cupones";
import type { CanjeStaffResponse } from "../../../api/staff";
import QRScanner from "./QRScanner";

interface Props {
  onSuccess: (data: CanjeStaffResponse) => void;
  onError: (msg: string) => void;
}

const QR_CLIENTE_RE = /^welve:\/\/cliente\/([^/]+)$/;

function errorDetail(e: unknown, fallback: string): string {
  const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return msg ?? fallback;
}

export default function CanjearCuponCard({ onSuccess, onError }: Props) {
  const [tab, setTab] = useState<"camara" | "codigo">("codigo");
  const [inputCodigo, setInputCodigo] = useState("");
  const [codigoBuscado, setCodigoBuscado] = useState<string | null>(null);
  const [qrClienteId, setQrClienteId] = useState<string | null>(null);
  const [scanNonce, setScanNonce] = useState(0);
  const [cuponSeleccionado, setCuponSeleccionado] = useState<Cupon | null>(null);
  const [monto, setMonto] = useState("");

  const porCodigo = useClientePorCodigo(codigoBuscado);
  const porQR = useClientePorQR(qrClienteId);
  const data = porCodigo.data ?? porQR.data;
  const cargando = porCodigo.isLoading || porQR.isLoading;
  const error = porCodigo.isError || porQR.isError;

  const canjePorCodigo = useCanjePorCodigo();
  const canjePorQR = useCanjePorQR();
  const confirmando = canjePorCodigo.isPending || canjePorQR.isPending;

  function handleBuscar(e: FormEvent) {
    e.preventDefault();
    if (!inputCodigo.trim()) return;
    setQrClienteId(null);
    setCodigoBuscado(inputCodigo.trim().toUpperCase());
  }

  function handleScan(decodedText: string) {
    const match = QR_CLIENTE_RE.exec(decodedText.trim());
    if (!match) {
      onError("Este QR no es un código de cliente de Welve.");
      setScanNonce((n) => n + 1);
      return;
    }
    setCodigoBuscado(null);
    setQrClienteId(match[1]);
    setScanNonce((n) => n + 1);
  }

  function limpiar() {
    setCuponSeleccionado(null);
    setCodigoBuscado(null);
    setQrClienteId(null);
    setInputCodigo("");
    setMonto("");
  }

  async function handleConfirmar() {
    if (!data || !cuponSeleccionado) return;
    const montoNumero = monto.trim() ? Number(monto) : undefined;
    try {
      const res = qrClienteId
        ? await canjePorQR.mutateAsync({ clienteId: qrClienteId, cuponId: cuponSeleccionado.id, monto: montoNumero })
        : await canjePorCodigo.mutateAsync({ codigoCliente: codigoBuscado!, cuponId: cuponSeleccionado.id, monto: montoNumero });
      limpiar();
      onSuccess(res);
    } catch (e) {
      onError(errorDetail(e, "No se pudo registrar el canje."));
    }
  }

  return (
    <div className="rounded-card bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-welve-100">
          <Ticket size={20} className="text-welve-600" />
        </div>
        <h2 className="text-base font-bold text-gray-900">Canjear cupón</h2>
      </div>

      {!data && (
        <>
          <div className="mb-4 flex gap-1 rounded-full bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setTab("camara")}
              className={`flex-1 rounded-full py-2 text-xs font-bold transition-colors ${tab === "camara" ? "bg-white text-welve-600 shadow-sm" : "text-gray-500"}`}
            >
              Escanear QR
            </button>
            <button
              type="button"
              onClick={() => setTab("codigo")}
              className={`flex-1 rounded-full py-2 text-xs font-bold transition-colors ${tab === "codigo" ? "bg-white text-welve-600 shadow-sm" : "text-gray-500"}`}
            >
              Código manual
            </button>
          </div>

          {tab === "camara" ? (
            <div className="mb-4 space-y-2">
              <QRScanner key={scanNonce} active={tab === "camara"} onScan={handleScan} />
              <p className="text-center text-[11px] text-gray-400">Apunta la cámara al QR personal del cliente (/wallet/mi-qr)</p>
            </div>
          ) : (
            <form onSubmit={handleBuscar} className="mb-4 flex gap-2">
              <input
                value={inputCodigo}
                onChange={(e) => setInputCodigo(e.target.value.toUpperCase())}
                placeholder="Código del cliente"
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold tracking-widest focus:border-welve-500 focus:outline-none focus:ring-2 focus:ring-welve-500/20"
              />
              <button
                type="submit"
                disabled={!inputCodigo.trim()}
                className="flex items-center gap-1.5 rounded-2xl bg-gray-900 px-4 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
              >
                <Search size={16} /> Buscar
              </button>
            </form>
          )}
        </>
      )}

      {cargando && <p className="text-center text-xs text-gray-400">Buscando cliente…</p>}
      {error && <p className="text-center text-xs text-red-500">Código no válido para esta empresa</p>}

      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-welve-50 p-4">
            <div>
              <p className="font-bold text-gray-900">{data.cliente.nombre}</p>
              <p className="text-xs text-gray-500">
                {data.relacion.visitasTotales} visitas · Racha {data.relacion.rachaActual} ·{" "}
                {data.relacion.segmento === "exclusivo" ? "Cliente VIP" : "Cliente regular"}
              </p>
            </div>
            <button onClick={limpiar} className="text-xs font-semibold text-gray-400 hover:text-gray-600">Cambiar</button>
          </div>

          {data.cuponesDisponibles.length === 0 ? (
            <p className="text-center text-xs text-gray-400">Este cliente no tiene cupones disponibles</p>
          ) : (
            <div className="space-y-2">
              {data.cuponesDisponibles.map((cupon) => (
                <button
                  key={cupon.id}
                  onClick={() => setCuponSeleccionado(cupon)}
                  className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-left transition-colors hover:border-welve-300 hover:bg-welve-50"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900">{cupon.nombre}</p>
                    <p className="text-xs text-gray-500">{TIPO_LABEL[cupon.tipo]}</p>
                  </div>
                  {cupon.valor !== null && (
                    <span className="text-sm font-black text-welve-700">
                      {cupon.tipo === "porcentual" ? `${cupon.valor}%` : `S/ ${cupon.valor}`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {cuponSeleccionado && data && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCuponSeleccionado(null)} />
          <div className="relative w-full max-w-sm rounded-modal bg-white p-6 text-center shadow-modal">
            <h3 className="mb-1 text-lg font-bold text-gray-900">¿Canjear {cuponSeleccionado.nombre}?</h3>
            <p className="mb-4 text-sm text-gray-500">para {data.cliente.nombre}</p>

            <div className="mb-4 text-left">
              <label className="mb-1 block text-xs font-semibold text-gray-500">
                Monto de la compra {cuponSeleccionado.montoMinimo ? `(mínimo S/${cuponSeleccionado.montoMinimo})` : "(opcional)"}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">S/</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-welve-500 focus:outline-none focus:ring-2 focus:ring-welve-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmar}
                disabled={confirmando}
                className="h-14 w-full rounded-2xl bg-[#3FD17A] text-sm font-bold text-white shadow-lg shadow-green-500/30 transition-transform active:scale-95 disabled:opacity-60"
              >
                {confirmando ? "Confirmando..." : "Confirmar canje"}
              </button>
              <button
                onClick={() => { setCuponSeleccionado(null); setMonto(""); }}
                className="w-full rounded-2xl py-2.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
