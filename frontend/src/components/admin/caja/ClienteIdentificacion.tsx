import { useEffect, useState } from "react";
import { UserCircle2, X, QrCode } from "lucide-react";
import { useClientePorCodigo, useClientePorQR } from "../../../hooks/useStaff";
import type { ClienteEnCaja } from "../../../hooks/useCaja";
import type { ClienteStaffResponse } from "../../../api/staff";
import { Input } from "../../ui";
import BarcodeScannerModal from "./BarcodeScannerModal";

interface Props {
  cliente: ClienteEnCaja | null;
  onIdentificar: (c: ClienteEnCaja | null) => void;
}

const CODIGO_RE = /^WLV-[A-Z0-9]{4}$/i;
// El QR personal del cliente (/wallet/mi-qr) codifica esto, no su
// codigo_cliente — ver wallet_service.get_mi_qr.
const QR_CLIENTE_RE = /^welve:\/\/cliente\/([^/]+)$/;

function aClienteEnCaja(data: ClienteStaffResponse): ClienteEnCaja {
  return {
    id: data.cliente.id,
    nombre: data.cliente.nombre,
    codigoCliente: data.cliente.codigoCliente,
    visitasTotales: data.relacion.visitasTotales,
    segmento: data.relacion.segmento,
    cuponesDisponibles: data.cuponesDisponibles,
  };
}

export default function ClienteIdentificacion({ cliente, onIdentificar }: Props) {
  const [input, setInput] = useState("");
  const [buscandoCodigo, setBuscandoCodigo] = useState<string | null>(null);
  const [buscandoQrId, setBuscandoQrId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [errorScan, setErrorScan] = useState(false);
  const porCodigo = useClientePorCodigo(buscandoCodigo);
  const porQR = useClientePorQR(buscandoQrId);

  useEffect(() => {
    const data = porCodigo.data ?? porQR.data;
    if (!data) return;
    onIdentificar(aClienteEnCaja(data));
    setBuscandoCodigo(null);
    setBuscandoQrId(null);
    setInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [porCodigo.data, porQR.data]);

  function buscarCodigo(codigo?: string) {
    const c = (codigo ?? input).trim();
    if (!c) return;
    setErrorScan(false);
    setBuscandoQrId(null);
    setBuscandoCodigo(c);
  }

  function handleScan(texto: string) {
    setScannerOpen(false);
    const qrMatch = QR_CLIENTE_RE.exec(texto.trim());
    if (qrMatch) {
      setErrorScan(false);
      setBuscandoCodigo(null);
      setBuscandoQrId(qrMatch[1]);
      return;
    }
    if (CODIGO_RE.test(texto)) { buscarCodigo(texto); return; }
    setErrorScan(true);
  }

  if (cliente) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-welve-50 p-3.5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-welve-500 text-white">
          <UserCircle2 size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">{cliente.nombre}</p>
          <p className="text-xs text-gray-500">{cliente.visitasTotales} visitas · {cliente.segmento === "exclusivo" ? "VIP" : "Regular"}</p>
        </div>
        <button onClick={() => onIdentificar(null)} className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscarCodigo()}
          placeholder="Código cliente WLV-XXXX"
          className="flex-1"
        />
        <button
          onClick={() => setScannerOpen(true)}
          className="flex flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 px-3.5 text-gray-500 transition-colors hover:border-welve-300 hover:text-welve-600"
        >
          <QrCode size={18} />
        </button>
      </div>
      {(porCodigo.isError || porQR.isError) && (
        <p className="mt-1.5 text-xs text-red-500">Código no encontrado</p>
      )}
      {errorScan && <p className="mt-1.5 text-xs text-red-500">Ese QR no es un código de cliente de Welve</p>}
      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onCodigo={handleScan} />
    </div>
  );
}
