import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useCuponDetalle } from '../../hooks/useWallet';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Skeleton, Toaster } from '../../components/ui';
import CuponHero from '../../components/wallet/cupon-detalle/CuponHero';
import ValorPrincipalCard from '../../components/wallet/cupon-detalle/ValorPrincipalCard';
import EmpresaRow from '../../components/wallet/cupon-detalle/EmpresaRow';
import TerminosAccordion from '../../components/wallet/cupon-detalle/TerminosAccordion';
import VigenciaInfo from '../../components/wallet/cupon-detalle/VigenciaInfo';
import CanjeCTA from '../../components/wallet/cupon-detalle/CanjeCTA';
import RelacionadosSection from '../../components/wallet/cupon-detalle/RelacionadosSection';
import CuponQRModal from '../../components/wallet/CuponQRModal';

export default function CuponDetallePage() {
  const { cuponId } = useParams<{ cuponId: string }>();
  const { data: cupon, isLoading } = useCuponDetalle(cuponId ?? '');
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [qrOpen, setQrOpen] = useState(false);

  async function handleCompartir() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: cupon?.nombre, url });
      } catch {
        // usuario canceló el share nativo, no hacer nada
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado');
    }
  }

  if (isLoading || !cupon) {
    return (
      <div className="min-h-screen bg-white">
        <Skeleton variant="rect" height={250} className="w-full" />
        <div className="space-y-4 p-6">
          <Skeleton variant="text" lines={3} />
          <Skeleton variant="rect" height={80} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-welve-50 pb-28">
      <CuponHero cupon={cupon} onCompartir={handleCompartir} />
      <ValorPrincipalCard cupon={cupon} />

      <div className="space-y-4 px-6 pt-6">
        <EmpresaRow empresa={cupon.empresa} />

        {cupon.descripcionLarga && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-sm leading-relaxed text-gray-700">{cupon.descripcionLarga}</p>
          </div>
        )}

        {cupon.instruccionesCanje && (
          <div className="flex items-start gap-2 rounded-2xl border border-welve-100 bg-welve-50 p-4">
            <Info size={16} className="mt-0.5 shrink-0 text-welve-500" />
            <p className="text-sm text-welve-700">{cupon.instruccionesCanje}</p>
          </div>
        )}

        {cupon.terminosCondiciones && <TerminosAccordion terminos={cupon.terminosCondiciones} />}

        <VigenciaInfo cupon={cupon} />

        <RelacionadosSection cupones={cupon.cuponesRelacionados} empresaNombre={cupon.empresa.nombre} />
      </div>

      <CanjeCTA cupon={cupon} isAuthenticated={isAuthenticated} onVerQR={() => setQrOpen(true)} />

      {qrOpen && <CuponQRModal cupon={cupon} empresaNombre={cupon.empresa.nombre} onClose={() => setQrOpen(false)} />}

      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}
