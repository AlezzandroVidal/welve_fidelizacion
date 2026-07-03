import { QrCode } from "lucide-react";
import { useEmpresaMe } from "../../hooks/useEmpresa";
import { useToast } from "../../hooks/useToast";
import { Toaster } from "../../components/ui";
import QRVisitaCard from "../../components/admin/qr/QRVisitaCard";
import CuponesQRList from "../../components/admin/qr/CuponesQRList";

export default function QRPage() {
  const { data: empresa, isLoading } = useEmpresaMe();
  const toast = useToast();

  if (isLoading) return <div className="p-6 text-sm text-gray-400">Cargando...</div>;
  if (!empresa) return <div className="p-6 text-sm text-red-500">No se pudo cargar la empresa.</div>;

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-welve-100">
          <QrCode size={20} className="text-welve-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mis QR Codes</h1>
          <p className="text-xs text-gray-400">
            Conecta tu local físico con Welve — los beneficios automáticos por historial se
            configuran ahora como cupones (pestaña Cupones → Visibilidad y acceso → "Por requisito").
          </p>
        </div>
      </div>

      <QRVisitaCard empresaId={empresa.id} empresaNombre={empresa.nombre} />
      <CuponesQRList />

      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}
