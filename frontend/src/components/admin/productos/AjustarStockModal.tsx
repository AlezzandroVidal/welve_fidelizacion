import { useState } from "react";
import { X } from "lucide-react";
import type { Producto, TipoMovimiento } from "../../../api/productos";
import { useUpdateStock } from "../../../hooks/useProductos";
import { SelectField, Input, Button } from "../../ui";

interface Props {
  producto: Producto | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

const TIPOS: { value: TipoMovimiento; label: string }[] = [
  { value: "entrada", label: "Entrada (compra/reposición)" },
  { value: "salida", label: "Salida (merma/pérdida)" },
  { value: "ajuste", label: "Ajuste de inventario" },
  { value: "devolucion", label: "Devolución" },
];

export default function AjustarStockModal({ producto, onClose, onSuccess }: Props) {
  const [tipo, setTipo] = useState<TipoMovimiento>("entrada");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const updateStock = useUpdateStock();

  if (!producto) return null;

  const cantidadNum = parseInt(cantidad, 10) || 0;
  const esNegativo = tipo === "salida";
  const delta = esNegativo ? -Math.abs(cantidadNum) : Math.abs(cantidadNum);
  const stockResultante = Math.max(0, producto.stockActual + delta);

  async function handleSubmit() {
    if (!cantidadNum) return;
    await updateStock.mutateAsync({ id: producto!.id, data: { cantidad: delta, tipo, motivo: motivo.trim() || null } });
    onSuccess(`Stock actualizado — ${producto!.nombre}: ${stockResultante} unidades`);
    setCantidad("");
    setMotivo("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">Ajustar stock</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-sm text-gray-500">{producto.nombre} — stock actual: <span className="font-semibold text-gray-800">{producto.stockActual}</span></p>

          <SelectField label="Tipo de movimiento" value={tipo} onChange={(e) => setTipo(e.target.value as TipoMovimiento)}>
            {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </SelectField>

          <Input
            type="number" min="1" label="Cantidad" value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />

          <Input label="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Compra a proveedor" />

          <div className="rounded-xl bg-gray-50 p-3 text-center text-sm">
            Stock resultante: <span className="font-bold text-welve-600">{stockResultante}</span>
          </div>

          <Button onClick={handleSubmit} disabled={!cantidadNum || updateStock.isPending} className="w-full">
            {updateStock.isPending ? "Guardando..." : "Confirmar ajuste"}
          </Button>
        </div>
      </div>
    </div>
  );
}
