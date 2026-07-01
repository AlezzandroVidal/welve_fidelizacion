import { FormEvent, useState } from "react";
import { UserCheck } from "lucide-react";
import { useVisitaPorCodigo, useVisitaPorQR } from "../../../hooks/useStaff";
import type { VisitaStaffResponse } from "../../../api/staff";
import QRScanner from "./QRScanner";

interface Props {
  onSuccess: (data: VisitaStaffResponse) => void;
  onError: (msg: string) => void;
}

const CLIENTE_QR_RE = /^welve:\/\/cliente\/([^/]+)$/;

function errorDetail(e: unknown, fallback: string): string {
  const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return msg ?? fallback;
}

export default function RegistrarVisitaCard({ onSuccess, onError }: Props) {
  const [tab, setTab] = useState<"camara" | "codigo">("codigo");
  const [codigo, setCodigo] = useState("");
  const [monto, setMonto] = useState("");
  const [scanNonce, setScanNonce] = useState(0);
  const visitaPorCodigo = useVisitaPorCodigo();
  const visitaPorQR = useVisitaPorQR();

  const montoNumero = monto.trim() ? Number(monto) : undefined;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;
    try {
      const data = await visitaPorCodigo.mutateAsync({ codigoCliente: codigo.trim(), monto: montoNumero });
      setCodigo("");
      setMonto("");
      onSuccess(data);
    } catch (e2) {
      onError(errorDetail(e2, "No se pudo registrar la visita."));
    }
  }

  async function handleScan(decodedText: string) {
    const match = CLIENTE_QR_RE.exec(decodedText.trim());
    if (!match) {
      onError("Este QR no es un código de cliente de Welve.");
      setScanNonce((n) => n + 1);
      return;
    }
    const [, clienteId] = match;
    try {
      const data = await visitaPorQR.mutateAsync({ clienteId, monto: montoNumero });
      setMonto("");
      onSuccess(data);
    } catch (e) {
      onError(errorDetail(e, "No se pudo registrar la visita."));
    } finally {
      setScanNonce((n) => n + 1);
    }
  }

  return (
    <div className="rounded-card bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-welve-100">
          <UserCheck size={20} className="text-welve-600" />
        </div>
        <h2 className="text-base font-bold text-gray-900">Registrar visita</h2>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold text-gray-500">Monto de la compra (opcional)</label>
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
        <div className="space-y-2">
          <QRScanner key={scanNonce} active={tab === "camara"} onScan={handleScan} />
          <p className="text-center text-[11px] text-gray-400">
            Apunta la cámara al QR personal del cliente (/wallet/mi-qr)
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="WLV-XXXX"
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-center text-lg font-black tracking-widest focus:border-welve-500 focus:outline-none focus:ring-2 focus:ring-welve-500/20"
          />
          <button
            type="submit"
            disabled={visitaPorCodigo.isPending || !codigo.trim()}
            className="h-14 w-full rounded-2xl bg-welve-500 text-sm font-bold text-white shadow-lg shadow-welve-500/30 transition-transform active:scale-95 disabled:opacity-60"
          >
            {visitaPorCodigo.isPending ? "Registrando..." : "Registrar visita"}
          </button>
        </form>
      )}
    </div>
  );
}
