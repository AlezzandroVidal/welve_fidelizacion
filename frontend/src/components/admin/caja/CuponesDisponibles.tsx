import { useState } from "react";
import { Gift, Check, ScanBarcode, AlertTriangle } from "lucide-react";
import { cuponesApi, type Cupon } from "../../../api/cupones";
import type { ItemCarritoInput } from "../../../api/caja";
import { useCuponesValidosParaCarrito } from "../../../hooks/useCupones";
import { Input } from "../../ui";
import BarcodeScannerModal from "./BarcodeScannerModal";

interface Props {
  items: ItemCarritoInput[];
  clienteId: string;
  /** Cupones del cliente sin filtrar por carrito — se muestran mientras el
   * carrito está vacío (ver CajaPage/ClienteIdentificacion). */
  cuponesCliente: Cupon[];
  cuponAplicado: Cupon | null;
  /** Motivo por el que el cupón aplicado no calificó para el carrito actual
   * (viene de calcularCarrito) — null si no hay problema. */
  erroresCupon: string | null;
  onAplicar: (c: Cupon) => void;
  onQuitar: () => void;
}

const TIPO_LABEL: Record<string, string> = {
  porcentual: "% de descuento", monto_fijo: "Descuento fijo",
  producto_gratis: "Producto gratis", dos_por_uno: "2×1",
  n_por_m: "NxM", envio_gratis: "Envío gratis", personalizado: "Personalizado",
};

export default function CuponesDisponibles({
  items, clienteId, cuponesCliente, cuponAplicado, erroresCupon, onAplicar, onQuitar,
}: Props) {
  const hayCarrito = items.length > 0;
  const { data: cuponesCarrito = [], isLoading } = useCuponesValidosParaCarrito(items, hayCarrito ? clienteId : null);
  const cupones = hayCarrito ? cuponesCarrito : cuponesCliente;

  const [codigo, setCodigo] = useState("");
  const [codigoError, setCodigoError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Si hay carrito y el cupón aplicado no aparece entre los válidos para él,
  // es que no cumple — mostramos el motivo explicativo, nunca un error genérico.
  const cuponNoValidoParaCarrito = hayCarrito && !!cuponAplicado && !cuponesCarrito.some((c) => c.id === cuponAplicado.id);

  async function buscarPorCodigo(valor: string) {
    const c = valor.trim();
    if (!c) return;
    setBuscando(true);
    setCodigoError(null);
    try {
      const { data: cupon } = await cuponesApi.buscarPorCodigo(c);
      onAplicar(cupon);
      setCodigo("");
    } catch {
      setCodigoError("Código no válido");
    } finally {
      setBuscando(false);
    }
  }

  function handleScan(codigoEscaneado: string) {
    setScannerOpen(false);
    buscarPorCodigo(codigoEscaneado);
  }

  return (
    <div className="space-y-3">
      {hayCarrito && isLoading ? (
        <p className="text-xs text-gray-400">Buscando beneficios...</p>
      ) : !cupones.length ? (
        <p className="text-xs text-gray-400">Sin cupones aplicables a este carrito</p>
      ) : (
        <div className="space-y-2">
          {cupones.map((c) => {
            const aplicado = cuponAplicado?.id === c.id;
            return (
              <div
                key={c.id}
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 ${aplicado ? "border-green-300 bg-green-50" : "border-gray-100"}`}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-welve-100 text-welve-600">
                  <Gift size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">{c.nombre}</p>
                  <p className="truncate text-[11px] text-gray-400">
                    {TIPO_LABEL[c.tipo]}
                    {c.valor ? ` · ${c.tipo === "porcentual" ? `${c.valor}%` : `S/${c.valor}`}` : ""}
                    {c.codigo ? ` · ${c.codigo}` : ""}
                  </p>
                </div>
                {aplicado ? (
                  <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-[10px] font-bold text-white">
                    <Check size={11} /> Aplicado
                  </span>
                ) : (
                  <button
                    onClick={() => onAplicar(c)}
                    className="flex-shrink-0 rounded-lg bg-welve-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-welve-600"
                  >
                    Aplicar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cuponNoValidoParaCarrito && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-red-700">{cuponAplicado!.nombre} no cumple</p>
            <p className="text-[11px] text-red-500">{erroresCupon}</p>
          </div>
          <button onClick={onQuitar} className="flex-shrink-0 text-[11px] font-semibold text-red-500 underline">
            Quitar
          </button>
        </div>
      )}

      {cuponAplicado && !cuponNoValidoParaCarrito && (
        <button onClick={onQuitar} className="text-xs font-semibold text-gray-400 hover:text-gray-600">
          Quitar cupón aplicado
        </button>
      )}

      <div>
        <p className="mb-1.5 text-[11px] font-semibold text-gray-400">¿Tienes un código?</p>
        <div className="flex gap-2">
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscarPorCodigo(codigo)}
            placeholder="Ej. CUP-4F2A"
            className="flex-1"
          />
          <button
            onClick={() => setScannerOpen(true)}
            className="flex flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 px-3.5 text-gray-500 transition-colors hover:border-welve-300 hover:text-welve-600"
          >
            <ScanBarcode size={18} />
          </button>
        </div>
        {buscando && <p className="mt-1 text-[11px] text-gray-400">Buscando...</p>}
        {codigoError && <p className="mt-1 text-[11px] text-red-500">{codigoError}</p>}
      </div>

      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onCodigo={handleScan} />
    </div>
  );
}
