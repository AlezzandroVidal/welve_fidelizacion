import { useState } from "react";
import { Lock } from "lucide-react";
import { useIniciarPago, useConfirmarPago, type PlanInfo } from "../../../hooks/usePagos";
import type { MetodoPago, Pago } from "../../../api/pagos";
import { detectarMarca, ultimos4Digitos, vencimientoValido, cvvValido } from "../../../utils/tarjeta";
import { Button } from "../../ui";
import MetodoPagoStep from "./checkout/MetodoPagoStep";
import TarjetaForm, { type TarjetaFormData } from "./checkout/TarjetaForm";
import YapePlinForm from "./checkout/YapePlinForm";
import TransferenciaInfo from "./checkout/TransferenciaInfo";
import ResumenStep from "./checkout/ResumenStep";
import ProcesandoStep from "./checkout/ProcesandoStep";
import ResultadoStep from "./checkout/ResultadoStep";

type Paso = "metodo" | "datos" | "resumen" | "procesando" | "resultado";

const PASOS_STEPPER: { key: Paso; label: string }[] = [
  { key: "metodo",  label: "Método" },
  { key: "datos",   label: "Datos" },
  { key: "resumen", label: "Resumen" },
];

const TARJETA_VACIA: TarjetaFormData = { numero: "", nombreTitular: "", vencimiento: "", cvv: "", recordar: false };

interface Props {
  open: boolean;
  onClose: () => void;
  plan: PlanInfo;
  empresaId: string;
}

export default function CheckoutModal({ open, onClose, plan, empresaId }: Props) {
  const [paso, setPaso] = useState<Paso>("metodo");
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [tarjeta, setTarjeta] = useState<TarjetaFormData>(TARJETA_VACIA);
  const [telefono, setTelefono] = useState("");
  const [operacion, setOperacion] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [resultado, setResultado] = useState<Pago | null>(null);

  const iniciarPago = useIniciarPago();
  const confirmarPago = useConfirmarPago();

  if (!open) return null;

  function resetYcerrar() {
    onClose();
    setTimeout(() => {
      setPaso("metodo"); setMetodo(null); setTarjeta(TARJETA_VACIA);
      setTelefono(""); setOperacion(""); setAceptaTerminos(false); setResultado(null);
    }, 200);
  }

  function datosValidos(): boolean {
    if (metodo === "tarjeta") {
      const digitos = tarjeta.numero.replace(/\D/g, "");
      return digitos.length === 16 && detectarMarca(digitos) !== "desconocida"
        && vencimientoValido(tarjeta.vencimiento) && cvvValido(tarjeta.cvv)
        && tarjeta.nombreTitular.trim().length > 1;
    }
    if (metodo === "yape" || metodo === "plin") {
      return telefono.length === 9 && operacion.trim().length > 0;
    }
    return metodo === "transferencia";
  }

  function descripcionMetodo(): string {
    if (metodo === "tarjeta") {
      const marca = detectarMarca(tarjeta.numero);
      const marcaLabel = marca === "visa" ? "Visa" : marca === "mastercard" ? "Mastercard" : "Tarjeta";
      return `${marcaLabel} ****${ultimos4Digitos(tarjeta.numero)}`;
    }
    if (metodo === "yape") return "Yape";
    if (metodo === "plin") return "Plin";
    return "Transferencia bancaria";
  }

  async function handlePagar() {
    if (!metodo) return;
    setPaso("procesando");
    try {
      const [mes, anio] = tarjeta.vencimiento.split("/");
      const pagoIniciado = await iniciarPago.mutateAsync({
        plan: plan.id,
        metodo_pago: metodo,
        tarjeta: metodo === "tarjeta" ? {
          ultimos_4: ultimos4Digitos(tarjeta.numero),
          marca_tarjeta: detectarMarca(tarjeta.numero),
          nombre_titular: tarjeta.nombreTitular,
          mes_expiracion: mes ?? "",
          anio_expiracion: anio ? `20${anio}` : "",
        } : undefined,
        numero_telefono: metodo === "yape" || metodo === "plin" ? telefono : undefined,
        numero_operacion: metodo === "yape" || metodo === "plin" ? operacion : undefined,
      });
      const pagoFinal = await confirmarPago.mutateAsync(pagoIniciado.id);
      setResultado(pagoFinal);
      setPaso("resultado");
    } catch {
      setPaso("resumen");
    }
  }

  const stepIndex = PASOS_STEPPER.findIndex((p) => p.key === (paso === "procesando" ? "resumen" : paso));
  const mostrarStepper = paso !== "procesando" && paso !== "resultado";
  const mostrarFooterNav = paso === "metodo" || paso === "datos";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1E1B2E]/60 backdrop-blur-sm animate-fade-in"
        onClick={paso === "procesando" ? undefined : resetYcerrar}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-modal bg-white shadow-modal animate-scale-in">
        <div className="flex-shrink-0 border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <Lock size={12} /> Pago seguro con Welve
          </div>
          {mostrarStepper && (
            <div className="mt-3 flex items-center gap-2">
              {PASOS_STEPPER.map((p, i) => (
                <div key={p.key} className="flex flex-1 items-center gap-2 last:flex-none">
                  <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i <= stepIndex ? "bg-welve-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-semibold ${i <= stepIndex ? "text-gray-700" : "text-gray-400"}`}>{p.label}</span>
                  {i < PASOS_STEPPER.length - 1 && <div className={`h-px flex-1 ${i < stepIndex ? "bg-welve-500" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {paso === "metodo" && <MetodoPagoStep value={metodo} onChange={setMetodo} />}

          {paso === "datos" && metodo === "tarjeta" && <TarjetaForm value={tarjeta} onChange={setTarjeta} />}
          {paso === "datos" && (metodo === "yape" || metodo === "plin") && (
            <YapePlinForm
              metodo={metodo}
              monto={plan.precio}
              numeroTelefono={telefono}
              numeroOperacion={operacion}
              onChangeTelefono={setTelefono}
              onChangeOperacion={setOperacion}
            />
          )}
          {paso === "datos" && metodo === "transferencia" && (
            <TransferenciaInfo monto={plan.precio} empresaId={empresaId} />
          )}

          {paso === "resumen" && (
            <ResumenStep
              plan={plan}
              descripcionMetodo={descripcionMetodo()}
              aceptaTerminos={aceptaTerminos}
              onChangeAcepta={setAceptaTerminos}
              onConfirmar={handlePagar}
              cargando={false}
            />
          )}

          {paso === "procesando" && <ProcesandoStep />}

          {paso === "resultado" && resultado && (
            <ResultadoStep
              pago={resultado}
              planNombre={plan.nombre}
              onContinuar={resetYcerrar}
              onReintentar={() => { setPaso("metodo"); setResultado(null); }}
              onCancelar={resetYcerrar}
            />
          )}
        </div>

        {mostrarFooterNav && (
          <div className="flex flex-shrink-0 items-center justify-between border-t border-gray-100 px-6 py-4">
            <button
              onClick={() => (paso === "datos" ? setPaso("metodo") : resetYcerrar())}
              className="text-sm font-semibold text-gray-400 transition-colors hover:text-gray-600"
            >
              {paso === "datos" ? "← Atrás" : "Cancelar"}
            </button>
            <Button
              onClick={() => setPaso(paso === "metodo" ? "datos" : "resumen")}
              disabled={paso === "metodo" ? !metodo : !datosValidos()}
            >
              Continuar →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
