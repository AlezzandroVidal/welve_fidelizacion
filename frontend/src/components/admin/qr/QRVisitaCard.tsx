import { ScanLine } from "lucide-react";
import QRDisplay from "../QRDisplay";

interface Props {
  empresaId: string;
  empresaNombre: string;
}

/**
 * QR de afiliación — el cliente lo escanea UNA SOLA VEZ para unirse al
 * programa (esa primera visita queda contada). Las visitas y canjes
 * siguientes las registra el staff desde el panel "Registrar".
 */
export default function QRVisitaCard({ empresaId, empresaNombre }: Props) {
  return (
    <div className="rounded-card border border-dashed border-welve-200 bg-white p-6 shadow-card">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-welve-100">
          <ScanLine size={20} className="text-welve-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">QR de afiliación — solo primera visita</h2>
          <p className="mt-0.5 max-w-md text-xs text-gray-500">
            El cliente escanea este QR UNA SOLA VEZ para registrarse en tu programa.
            Las visitas siguientes las registra tu staff desde el panel.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <QRDisplay path={`/qr/visita/${empresaId}`} size="lg" />

        <div className="flex-1 space-y-4">
          <div className="rounded-xl bg-welve-50 p-4 text-sm text-gray-600">
            Imprime este QR y colócalo en tu local, menú, o compártelo en tus redes sociales.
          </div>

          {/* Mockup simple de cómo lo ve el cliente en su celular */}
          <div className="mx-auto w-40 rounded-[24px] border-4 border-gray-900 bg-gray-900 p-1.5 shadow-xl">
            <div className="rounded-[18px] bg-gradient-to-br from-welve-400 to-welve-600 px-3 py-5 text-center">
              <p className="text-[10px] font-bold leading-tight text-white">
                ¡Únete al programa de {empresaNombre}!
              </p>
              <div className="mx-auto mt-3 h-9 w-9 rounded-md bg-white/25" />
              <p className="mt-3 rounded-full bg-white/20 py-1 text-[8px] font-semibold text-white">
                Registrarme →
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
