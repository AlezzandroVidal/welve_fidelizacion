import { Download, Mail } from "lucide-react";
import { Sheet, Badge, Button, type BadgeColor } from "../../ui";
import { useToast } from "../../../hooks/useToast";
import type { Pago, EstadoPago } from "../../../api/pagos";

const ESTADO_BADGE: Record<EstadoPago, { label: string; color: BadgeColor }> = {
  pendiente:   { label: "Pendiente",   color: "gray"   },
  procesando:  { label: "Procesando",  color: "blue"   },
  aprobado:    { label: "Aprobado",    color: "green"  },
  rechazado:   { label: "Rechazado",   color: "red"    },
  reembolsado: { label: "Reembolsado", color: "purple" },
};

const METODO_LABEL: Record<string, string> = {
  tarjeta: "Tarjeta", yape: "Yape", plin: "Plin", transferencia: "Transferencia bancaria",
};

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
}

/** Construye la ventana de impresión con el DOM (nunca strings HTML) para no
 * arrastrar riesgo de inyección con datos de la empresa/pago. */
function imprimirComprobante(pago: Pago, empresaNombre: string) {
  const win = window.open("", "_blank", "width=480,height=680");
  if (!win) return;

  const row = (label: string, value: string) => {
    const wrap = win.document.createElement("div");
    wrap.style.cssText = "display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:13px;";
    const l = win.document.createElement("span");
    l.style.color = "#8A8A99";
    l.textContent = label;
    const v = win.document.createElement("span");
    v.style.cssText = "font-weight:600;color:#15151A;";
    v.textContent = value;
    wrap.append(l, v);
    return wrap;
  };

  win.document.title = `Comprobante ${pago.referencia}`;
  const body = win.document.body;
  body.style.cssText = "font-family:Arial,sans-serif;padding:32px;max-width:420px;margin:0 auto;";

  const logo = win.document.createElement("div");
  logo.style.cssText = "font-weight:900;font-size:20px;color:#7C5CFC;margin-bottom:4px;";
  logo.textContent = "Welve";
  body.appendChild(logo);

  const ref = win.document.createElement("p");
  ref.style.cssText = "font-family:monospace;color:#8A8A99;font-size:12px;margin:0 0 20px;";
  ref.textContent = pago.referencia;
  body.appendChild(ref);

  body.appendChild(row("Empresa", empresaNombre));
  body.appendChild(row("Plan", pago.plan.charAt(0).toUpperCase() + pago.plan.slice(1)));
  body.appendChild(row("Método de pago", METODO_LABEL[pago.metodoPago] ?? pago.metodoPago));
  body.appendChild(row("Monto", `S/ ${pago.monto.toFixed(2)}`));
  body.appendChild(row("Estado", ESTADO_BADGE[pago.estado].label));
  body.appendChild(row("Fecha", fmtFecha(pago.createdAt)));

  win.document.close();
  win.focus();
  win.print();
}

interface Props {
  pago: Pago | null;
  empresaNombre: string;
  onClose: () => void;
}

export default function ComprobanteSheet({ pago, empresaNombre, onClose }: Props) {
  const toast = useToast();

  return (
    <Sheet open={!!pago} onClose={onClose} title="Comprobante de pago" subtitle={pago?.referencia}>
      {pago && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-lg font-black text-welve-500">Welve</p>
            <p className="mt-1 font-mono text-xs text-gray-400">{pago.referencia}</p>
            <Badge color={ESTADO_BADGE[pago.estado].color} className="mt-2">
              {ESTADO_BADGE[pago.estado].label}
            </Badge>
          </div>

          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 px-4">
            {[
              ["Empresa", empresaNombre],
              ["Plan", pago.plan.charAt(0).toUpperCase() + pago.plan.slice(1)],
              ["Concepto", pago.concepto],
              ["Método de pago", METODO_LABEL[pago.metodoPago] ?? pago.metodoPago],
              ...(pago.ultimos4 ? [["Tarjeta", `${pago.marcaTarjeta ?? ""} ****${pago.ultimos4}`]] : []),
              ["Monto", `S/ ${pago.monto.toFixed(2)}`],
              ["Fecha", fmtFecha(pago.createdAt)],
              ...(pago.motivoRechazo ? [["Motivo de rechazo", pago.motivoRechazo]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-semibold text-gray-800 text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5">
            <Button variant="secondary" className="flex-1" onClick={() => imprimirComprobante(pago, empresaNombre)}>
              <Download size={15} /> Descargar PDF
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => toast.success("Comprobante enviado por email")}>
              <Mail size={15} /> Enviar por email
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
