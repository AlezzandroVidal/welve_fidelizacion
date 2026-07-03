import { useState } from "react";
import { CreditCard, Check } from "lucide-react";
import { useEmpresaMe } from "../../hooks/useEmpresa";
import { useHistorialPagos, usePlanesInfo, type PlanInfo } from "../../hooks/usePagos";
import { Table, Badge, Button, type BadgeColor } from "../../components/ui";
import CheckoutModal from "../../components/admin/pagos/CheckoutModal";
import ComprobanteSheet from "../../components/admin/pagos/ComprobanteSheet";
import type { Pago, EstadoPago } from "../../api/pagos";

const ESTADO_PAGO_BADGE: Record<EstadoPago, { label: string; color: BadgeColor }> = {
  pendiente:   { label: "Pendiente",   color: "gray"   },
  procesando:  { label: "Procesando",  color: "blue"   },
  aprobado:    { label: "Aprobado",    color: "green"  },
  rechazado:   { label: "Rechazado",   color: "red"    },
  reembolsado: { label: "Reembolsado", color: "purple" },
};

const METODO_LABEL: Record<string, string> = {
  tarjeta: "Tarjeta", yape: "Yape", plin: "Plin", transferencia: "Transferencia",
};

function fmtFechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
}

function fmtFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

const TABLE_COLS = [
  { label: "Referencia" }, { label: "Plan" }, { label: "Monto" },
  { label: "Método" }, { label: "Estado" }, { label: "Fecha" },
];

export default function PagosPage() {
  const { data: empresa } = useEmpresaMe();
  const { data: pagos = [], isLoading } = useHistorialPagos();
  const planes = usePlanesInfo();

  const [planCheckout, setPlanCheckout] = useState<PlanInfo | null>(null);
  const [pagoDetalle,  setPagoDetalle]  = useState<Pago | null>(null);

  if (!empresa) return null;

  const planActual = planes.find((p) => p.id === empresa.planSuscripcion) ?? planes[0];
  const vencimiento = empresa.fechaVencimientoPlan;
  const ahora = Date.now();
  const vencido = vencimiento ? new Date(vencimiento).getTime() < ahora : false;
  const estadoLabel = !vencimiento ? "Prueba gratis" : vencido ? "Vencido" : "Activo";
  const estadoColor = !vencimiento
    ? "bg-blue-100 text-blue-700"
    : vencido ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700";

  let diasUsados = 0;
  if (vencimiento) {
    const inicio = new Date(vencimiento).getTime() - 30 * 86_400_000;
    diasUsados = Math.min(30, Math.max(0, Math.round((ahora - inicio) / 86_400_000)));
  }

  return (
    <main className="p-6 space-y-6 max-w-[1200px]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-welve-100">
          <CreditCard size={20} className="text-welve-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Suscripción</h1>
          <p className="text-xs text-gray-400">Plan y facturación de tu cuenta Welve</p>
        </div>
      </div>

      {/* Sección 1 — plan actual */}
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-gray-900">Plan {planActual.nombre}</h2>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${estadoColor}`}>{estadoLabel}</span>
            </div>
            <p className="text-sm text-gray-500">
              {vencimiento ? `Vence el ${fmtFechaLarga(vencimiento)}` : "Aún no registras un pago — estás en periodo de prueba"}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => document.getElementById("planes")?.scrollIntoView({ behavior: "smooth" })}
          >
            Cambiar plan
          </Button>
        </div>

        {vencimiento && (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
              <span>Período actual</span>
              <span>{diasUsados}/30 días</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-welve-500 transition-all" style={{ width: `${(diasUsados / 30) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Sección 2 — comparación de planes */}
      <div id="planes">
        <h2 className="mb-3 text-base font-bold text-gray-900">Planes disponibles</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {planes.map((p) => {
            const esActual = p.id === planActual.id;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border-2 bg-white p-5 shadow-card ${esActual ? "border-welve-500" : "border-transparent"}`}
              >
                {esActual && (
                  <span className="absolute -top-3 left-5 rounded-full bg-welve-500 px-3 py-1 text-[10px] font-bold text-white">
                    Tu plan actual
                  </span>
                )}
                <p className="text-sm font-bold text-gray-900">{p.nombre}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  S/{p.precio}<span className="text-sm font-medium text-gray-400">/mes</span>
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check size={15} className="mt-0.5 flex-shrink-0 text-welve-500" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5 w-full"
                  variant={esActual ? "secondary" : "primary"}
                  disabled={esActual}
                  onClick={() => setPlanCheckout(p)}
                >
                  {esActual ? "Plan activo" : "Seleccionar"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección 3 — historial de pagos */}
      <div>
        <h2 className="mb-3 text-base font-bold text-gray-900">Historial de pagos</h2>
        <Table.Root>
          <Table.Header cols={TABLE_COLS} />
          {isLoading ? (
            <Table.Loading cols={TABLE_COLS.length} />
          ) : !pagos.length ? (
            <Table.Empty icon={<CreditCard size={36} />} message="Aún no tienes pagos registrados" />
          ) : (
            <Table.Body>
              {pagos.map((pago) => (
                <Table.Row key={pago.id} onClick={() => setPagoDetalle(pago)}>
                  <Table.Cell><span className="font-mono text-xs text-gray-500">{pago.referencia}</span></Table.Cell>
                  <Table.Cell><span className="text-sm capitalize text-gray-700">{pago.plan}</span></Table.Cell>
                  <Table.Cell><span className="text-sm font-semibold text-gray-900">S/ {pago.monto.toFixed(2)}</span></Table.Cell>
                  <Table.Cell><span className="text-sm text-gray-600">{METODO_LABEL[pago.metodoPago]}</span></Table.Cell>
                  <Table.Cell>
                    <Badge color={ESTADO_PAGO_BADGE[pago.estado].color} size="sm">
                      {ESTADO_PAGO_BADGE[pago.estado].label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell><span className="text-sm text-gray-500">{fmtFechaCorta(pago.createdAt)}</span></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          )}
        </Table.Root>
      </div>

      {planCheckout && (
        <CheckoutModal
          open
          plan={planCheckout}
          empresaId={empresa.id}
          onClose={() => setPlanCheckout(null)}
        />
      )}
      <ComprobanteSheet pago={pagoDetalle} empresaNombre={empresa.nombre} onClose={() => setPagoDetalle(null)} />
    </main>
  );
}
