import { useState } from "react";
import { ScanLine } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { Toaster } from "../../components/ui";
import RegistrarVisitaCard from "../../components/admin/staff/RegistrarVisitaCard";
import CanjearCuponCard from "../../components/admin/staff/CanjearCuponCard";
import ResultadoStaffOverlay from "../../components/admin/staff/ResultadoStaffOverlay";
import type { VisitaStaffResponse, CanjeStaffResponse } from "../../api/staff";
import type { ResultadoVisita } from "../../api/qr";

interface ResultadoMostrado {
  clienteNombre: string;
  resultado: ResultadoVisita;
}

export default function StaffPage() {
  const toast = useToast();
  const [resultado, setResultado] = useState<ResultadoMostrado | null>(null);

  function handleVisitaExitosa(data: VisitaStaffResponse) {
    setResultado({ clienteNombre: data.clienteNombre, resultado: data.resultado });
  }

  function handleCanjeExitoso(data: CanjeStaffResponse) {
    setResultado({ clienteNombre: data.clienteNombre, resultado: data.resultado });
  }

  return (
    <main className="space-y-6 p-4 pb-10 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-welve-100">
          <ScanLine size={20} className="text-welve-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Registrar</h1>
          <p className="text-xs text-gray-400">Visitas y canjes de tus clientes en el local</p>
        </div>
      </div>

      <RegistrarVisitaCard onSuccess={handleVisitaExitosa} onError={toast.error} />
      <CanjearCuponCard onSuccess={handleCanjeExitoso} onError={toast.error} />

      {resultado && (
        <ResultadoStaffOverlay
          clienteNombre={resultado.clienteNombre}
          resultado={resultado.resultado}
          onDone={() => setResultado(null)}
        />
      )}

      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}
