import type { useCaja, DatosPago } from "../../../hooks/useCaja";
import type { CarritoCalculado } from "../../../api/caja";
import ClienteIdentificacion from "./ClienteIdentificacion";
import CarritoItems from "./CarritoItems";
import CuponesDisponibles from "./CuponesDisponibles";
import ResumenCobro from "./ResumenCobro";

interface Props {
  caja: ReturnType<typeof useCaja>;
  carrito: CarritoCalculado | undefined;
  cobrando: boolean;
  onCobrar: (datos: DatosPago) => void;
}

export default function CarritoPanel({ caja, carrito, cobrando, onCobrar }: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card">
      {/* Fijo arriba — nunca scrollea */}
      <div className="flex-shrink-0 p-4 pb-0">
        <ClienteIdentificacion cliente={caja.cliente} onIdentificar={caja.setCliente} />
      </div>

      {/* Único scroll de la columna: items + cupones. min-h-0 es necesario
          para que un hijo flex con overflow-y-auto respete el alto del padre
          en vez de crecer con el contenido (bug clásico de flexbox). */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Carrito ({caja.items.length})</p>
          <CarritoItems items={caja.items} onCambiarCantidad={caja.cambiarCantidad} onQuitar={caja.quitarItem} />
        </div>

        {caja.cliente && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Beneficios disponibles</p>
            <CuponesDisponibles
              items={caja.itemsInput}
              clienteId={caja.cliente.id}
              cuponesCliente={caja.cliente.cuponesDisponibles}
              cuponAplicado={caja.cuponAplicado}
              erroresCupon={carrito?.erroresCupon ?? null}
              onAplicar={caja.aplicarCupon}
              onQuitar={caja.quitarCupon}
            />
          </div>
        )}
      </div>

      {/* Fijo abajo — pago y cobro siempre visibles, nunca se comprime */}
      <div className="flex-shrink-0 border-t border-gray-100 p-4">
        <ResumenCobro
          carrito={carrito} disabled={caja.items.length === 0} cobrando={cobrando} onCobrar={onCobrar}
          onCancelar={caja.limpiarCaja}
          hayAlgoQueCancelar={caja.items.length > 0 || !!caja.cliente}
        />
      </div>
    </div>
  );
}
