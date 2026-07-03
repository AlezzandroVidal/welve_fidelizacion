import { useLocation, useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import type { CuponDetalle } from '../../../api/wallet';

interface Props {
  cupon: CuponDetalle;
  isAuthenticated: boolean;
  onVerQR: () => void;
}

export default function CanjeCTA({ cupon, isAuthenticated, onVerQR }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  let label: string;
  let onClick: (() => void) | undefined;
  let disabled = false;
  let showIcon = false;

  if (!isAuthenticated) {
    label = 'Inicia sesión para canjear';
    onClick = () => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
  } else if (cupon.estaDisponibleParaMi) {
    label = 'Ver mi código QR';
    onClick = onVerQR;
    showIcon = true;
  } else if (!cupon.estaVigente) {
    label = 'Cupón expirado';
    disabled = true;
  } else {
    label = 'Ya canjeaste este cupón';
    disabled = true;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white/95 p-4 backdrop-blur-md">
      <button
        onClick={onClick}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3.5 font-bold text-white shadow-lg shadow-gray-900/20 transition-transform active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
      >
        {showIcon && <QrCode size={18} />}
        {label}
      </button>
    </div>
  );
}
