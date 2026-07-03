import { useEffect, useState } from "react";
import { ShoppingCart, Package } from "lucide-react";
import { useCaja } from "../../hooks/useCaja";
import CatalogoPanel from "../../components/admin/caja/CatalogoPanel";
import CarritoPanel from "../../components/admin/caja/CarritoPanel";
import ResultadoVentaModal from "../../components/admin/caja/ResultadoVentaModal";
import TicketVenta from "../../components/admin/caja/TicketVenta";
import { useToast } from "../../hooks/useToast";
import { Toaster } from "../../components/ui";
import type { Venta } from "../../api/ventas";

type TabMobile = "productos" | "carrito";

export default function CajaPage() {
  const caja = useCaja();
  const toast = useToast();
  const [tabMobile, setTabMobile] = useState<TabMobile>("productos");
  const [ventaCompletada, setVentaCompletada] = useState<Venta | null>(null);
  const [ticketVenta, setTicketVenta] = useState<Venta | null>(null);

  useEffect(() => {
    if (caja.items.length === 0) {
      caja.calcularCarrito.reset();
      return;
    }
    caja.calcularCarrito.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caja.itemsInput, caja.cliente?.id, caja.cuponAplicado?.id]);

  async function handleCobrar(datosPago: Parameters<typeof caja.procesarVenta.mutateAsync>[0]) {
    try {
      const venta = await caja.procesarVenta.mutateAsync(datosPago);
      setVentaCompletada(venta);
    } catch {
      toast.error("No se pudo procesar la venta");
    }
  }

  function handleNuevaVenta() {
    setVentaCompletada(null);
    caja.limpiarCaja();
  }

  return (
    <main className="flex h-[calc(100vh-5.5rem)] flex-col gap-4 bg-welve-50 p-4 text-base md:h-[calc(100vh-2rem)] lg:flex-row">
      {/* Tabs mobile */}
      <div className="flex gap-2 lg:hidden">
        {[
          { key: "productos" as TabMobile, label: "Productos", icon: Package },
          { key: "carrito" as TabMobile, label: `Carrito (${caja.items.length})`, icon: ShoppingCart },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTabMobile(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors
              ${tabMobile === t.key ? "bg-welve-500 text-white" : "bg-white text-gray-500"}`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className={`min-h-0 flex-[3] ${tabMobile !== "productos" ? "hidden lg:block" : ""}`}>
        <CatalogoPanel onAgregar={caja.agregarItem} />
      </div>
      <div className={`min-h-0 flex-[2] ${tabMobile !== "carrito" ? "hidden lg:block" : ""}`}>
        <CarritoPanel
          caja={caja}
          carrito={caja.calcularCarrito.data}
          cobrando={caja.procesarVenta.isPending}
          onCobrar={handleCobrar}
        />
      </div>

      <ResultadoVentaModal
        venta={ventaCompletada}
        onNuevaVenta={handleNuevaVenta}
        onVerComprobante={() => { setTicketVenta(ventaCompletada); setVentaCompletada(null); }}
      />
      <TicketVenta venta={ticketVenta} onClose={() => { setTicketVenta(null); caja.limpiarCaja(); }} />
      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}
