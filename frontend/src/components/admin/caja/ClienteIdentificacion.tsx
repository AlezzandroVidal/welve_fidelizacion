import { useEffect, useState } from "react";
import { UserCircle2, X, QrCode } from "lucide-react";
import { useClientePorCodigo } from "../../../hooks/useStaff";
import type { ClienteEnCaja } from "../../../hooks/useCaja";
import { Input } from "../../ui";
import BarcodeScannerModal from "./BarcodeScannerModal";

interface Props {
  cliente: ClienteEnCaja | null;
  onIdentificar: (c: ClienteEnCaja | null) => void;
}

const CODIGO_RE = /^WLV-[A-Z0-9]{4}$/i;

export default function ClienteIdentificacion({ cliente, onIdentificar }: Props) {
  const [input, setInput] = useState("");
  const [buscando, setBuscando] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { data, isError } = useClientePorCodigo(buscando);

  useEffect(() => {
    if (!data) return;
    onIdentificar({
      id: data.cliente.id,
      nombre: data.cliente.nombre,
      codigoCliente: data.cliente.codigoCliente,
      visitasTotales: data.relacion.visitasTotales,
      segmento: data.relacion.segmento,
      cuponesDisponibles: data.cuponesDisponibles,
    });
    setBuscando(null);
    setInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  function buscar(codigo?: string) {
    const c = (codigo ?? input).trim();
    if (!c) return;
    setBuscando(c);
  }

  function handleScan(codigo: string) {
    setScannerOpen(false);
    if (CODIGO_RE.test(codigo)) buscar(codigo);
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
          onKeyDown={(e) => e.key === "Enter" && buscar()}
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
      {isError && buscando && <p className="mt-1.5 text-xs text-red-500">Código no encontrado</p>}
      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onCodigo={handleScan} />
    </div>
  );
}
