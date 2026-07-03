import type { Venta } from "../api/ventas";

const METODO_LABEL: Record<string, string> = {
  efectivo: "Efectivo", tarjeta: "Tarjeta", yape: "Yape", plin: "Plin", mixto: "Mixto",
};

/** Construye el ticket en una ventana aislada vía DOM (nunca strings HTML)
 * — así "solo el ticket, sin botones" es automático: esa ventana no tiene
 * nada más que el contenido del comprobante. */
export function imprimirTicket(venta: Venta) {
  const win = window.open("", "_blank", "width=380,height=600");
  if (!win) return;

  win.document.title = `Venta ${venta.id.slice(-6)}`;
  const body = win.document.body;
  body.style.cssText = "font-family:monospace;padding:20px;max-width:320px;margin:0 auto;font-size:12px;color:#222;";

  const hr = () => {
    const el = win.document.createElement("hr");
    el.style.cssText = "border:none;border-top:1px dashed #ccc;margin:8px 0;";
    return el;
  };
  const row = (label: string, value: string, bold = false) => {
    const el = win.document.createElement("div");
    el.style.cssText = `display:flex;justify-content:space-between;margin-bottom:3px;${bold ? "font-weight:900;font-size:14px;margin-top:6px;" : ""}`;
    const l = win.document.createElement("span");
    l.textContent = label;
    const v = win.document.createElement("span");
    v.textContent = value;
    el.append(l, v);
    return el;
  };

  const logo = win.document.createElement("p");
  logo.style.cssText = "text-align:center;font-weight:900;font-size:16px;color:#7C5CFC;margin:0 0 2px;";
  logo.textContent = "Welve";
  body.appendChild(logo);

  const fecha = win.document.createElement("p");
  fecha.style.cssText = "text-align:center;color:#888;margin:0 0 12px;";
  fecha.textContent = new Date(venta.createdAt).toLocaleString("es-PE");
  body.appendChild(fecha);

  body.appendChild(hr());
  venta.items.forEach((item) => body.appendChild(row(`${item.cantidad}x ${item.nombreProducto}`, `S/ ${item.subtotal.toFixed(2)}`)));
  body.appendChild(hr());

  body.appendChild(row("Subtotal", `S/ ${venta.subtotal.toFixed(2)}`));
  if (venta.descuentoMonto > 0) {
    body.appendChild(row(`Descuento${venta.cuponCodigo ? ` (${venta.cuponCodigo})` : ""}`, `-S/ ${venta.descuentoMonto.toFixed(2)}`));
  }
  body.appendChild(row("IGV (18%)", `S/ ${venta.igv.toFixed(2)}`));
  body.appendChild(row("TOTAL", `S/ ${venta.total.toFixed(2)}`, true));
  body.appendChild(hr());

  const metodo = win.document.createElement("p");
  metodo.textContent = `Método de pago: ${METODO_LABEL[venta.metodoPago] ?? venta.metodoPago}`;
  body.appendChild(metodo);

  if (venta.clienteNombre) {
    const cliente = win.document.createElement("p");
    cliente.textContent = `Cliente: ${venta.clienteNombre}${venta.codigoCliente ? ` (${venta.codigoCliente})` : ""}`;
    body.appendChild(cliente);
  }

  body.appendChild(hr());
  const gracias = win.document.createElement("p");
  gracias.style.cssText = "text-align:center;margin-top:12px;color:#888;";
  gracias.textContent = "Gracias por tu compra — Welve";
  body.appendChild(gracias);

  win.document.close();
  win.focus();
  win.print();
}
