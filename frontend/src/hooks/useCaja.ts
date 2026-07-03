import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cajaApi, ItemCarritoInput } from "../api/caja";
import type { Cupon } from "../api/cupones";
import type { Producto } from "../api/productos";
import type { MetodoPagoVenta } from "../api/ventas";

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export interface ClienteEnCaja {
  id: string;
  nombre: string;
  codigoCliente: string;
  visitasTotales: number;
  segmento: string;
  /** Cupones del cliente al momento de identificarlo, sin filtrar por
   * carrito — se usan mientras el carrito está vacío (ver CuponesDisponibles). */
  cuponesDisponibles: Cupon[];
}

export interface DatosPago {
  metodo_pago: MetodoPagoVenta;
  monto_efectivo?: number;
  monto_tarjeta?: number;
  monto_yape?: number;
}

/** Estado del carrito de la Caja — vive solo en memoria (React state), nunca
 * en base de datos. Solo se persiste al llamar procesarVenta(). */
export function useCaja() {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [cliente, setClienteState] = useState<ClienteEnCaja | null>(null);
  const [cuponAplicado, setCuponAplicadoState] = useState<Cupon | null>(null);
  const qc = useQueryClient();

  function agregarItem(producto: Producto, cantidad = 1) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.producto.id === producto.id);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + cantidad };
        return copia;
      }
      return [...prev, { producto, cantidad }];
    });
  }

  function quitarItem(productoId: string) {
    setItems((prev) => prev.filter((i) => i.producto.id !== productoId));
  }

  function cambiarCantidad(productoId: string, cantidad: number) {
    if (cantidad <= 0) { quitarItem(productoId); return; }
    setItems((prev) => prev.map((i) => (i.producto.id === productoId ? { ...i, cantidad } : i)));
  }

  function setCliente(c: ClienteEnCaja | null) {
    setClienteState(c);
    if (!c) setCuponAplicadoState(null);
  }

  function aplicarCupon(cupon: Cupon) {
    setCuponAplicadoState(cupon);
  }

  function quitarCupon() {
    setCuponAplicadoState(null);
  }

  function limpiarCaja() {
    setItems([]);
    setClienteState(null);
    setCuponAplicadoState(null);
  }

  const itemsInput: ItemCarritoInput[] = useMemo(
    () => items.map((i) => ({ producto_id: i.producto.id, cantidad: i.cantidad })),
    [items],
  );

  const calcularCarrito = useMutation({
    mutationFn: () => cajaApi.calcular({
      items: itemsInput,
      cupon_id: cuponAplicado?.id ?? null,
      cliente_id: cliente?.id ?? null,
    }).then((r) => r.data),
  });

  const procesarVenta = useMutation({
    mutationFn: (datosPago: DatosPago) => cajaApi.procesar({
      items: itemsInput,
      cliente_id: cliente?.id ?? null,
      cupon_id: cuponAplicado?.id ?? null,
      ...datosPago,
    }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productos"] });
      qc.invalidateQueries({ queryKey: ["ventas"] });
    },
  });

  return {
    items,
    cliente,
    cuponAplicado,
    itemsInput,
    agregarItem,
    quitarItem,
    cambiarCantidad,
    setCliente,
    aplicarCupon,
    quitarCupon,
    limpiarCaja,
    calcularCarrito,
    procesarVenta,
  };
}
