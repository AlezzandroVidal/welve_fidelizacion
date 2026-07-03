import { useState } from "react";
import { ScanBarcode, AlertTriangle } from "lucide-react";
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

/** Chip corto: para porcentual/monto_fijo antepone el valor (ej. "15% OFF"),
 * el resto usa el nombre truncado — no todos los tipos tienen un "valor"
 * que se lea bien como prefijo (producto_gratis, dos_por_uno, etc). */
function chipLabel(c: Cupon): string {
  if (c.tipo === "porcentual" && c.valor) return `${c.valor}% OFF`;
  if (c.tipo === "monto_fijo" && c.valor) return `S/${c.valor} OFF`;
  return c.nombre.length > 22 ? `${c.nombre.slice(0, 22)}…` : c.nombre;
}

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
    <div className="space-y-2.5">
      {hayCarrito && isLoading ? (
        <p className="text-xs text-gray-400">Buscando beneficios...</p>
      ) : !cupones.length ? (
        <p className="text-xs text-gray-400">Sin cupones disponibles</p>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {cupones.map((c) => {
            const aplicado = cuponAplicado?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => (aplicado ? onQuitar() : onAplicar(c))}
                title={c.nombre}
                className={`h-8 flex-shrink-0 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors
                  ${aplicado ? "bg-welve-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {chipLabel(c)}
              </button>
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

      {/* Fallback solo si el cupón aplicado no aparece como chip (ej. se
          aplicó por código manual y no está en la lista de disponibles) —
          en el caso normal, tocar el chip aplicado de nuevo ya lo quita. */}
      {cuponAplicado && !cuponNoValidoParaCarrito && !cupones.some((c) => c.id === cuponAplicado.id) && (
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
