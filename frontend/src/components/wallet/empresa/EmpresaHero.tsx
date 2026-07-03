import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Users, Music2, QrCode } from 'lucide-react';

const GRADIENTE_RUBRO: Record<string, string> = {
  food_beverage: 'from-orange-400 to-yellow-400',
  belleza: 'from-pink-400 to-purple-500',
  retail: 'from-blue-400 to-emerald-400',
};

function socialUrl(kind: 'instagram' | 'facebook' | 'tiktok', value: string): string {
  if (value.startsWith('http')) return value;
  const handle = value.replace(/^@/, '').replace(/^(instagram|facebook|tiktok)\.com\/@?/, '');
  if (kind === 'instagram') return `https://instagram.com/${handle}`;
  if (kind === 'tiktok') return `https://tiktok.com/@${handle}`;
  return `https://facebook.com/${handle}`;
}

interface Props {
  empresa: any;
  empresaId: string;
  isAuthenticated?: boolean;
}

export default function EmpresaHero({ empresa, empresaId, isAuthenticated }: Props) {
  const navigate = useNavigate();
  const gradiente = GRADIENTE_RUBRO[empresa.rubro] ?? 'from-gray-400 to-slate-600';

  // Vuelve al historial si hay uno propio (ej. viniendo del wallet); si es
  // acceso directo (link compartido sin sesión) cae a /wallet, igual que
  // CuponDetallePage.
  const volver = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/wallet');
  };

  return (
    <div>
      <div className={`relative h-[200px] w-full overflow-hidden rounded-b-[40px] bg-gradient-to-br ${gradiente} shadow-sm`}>
        {empresa.imagen_portada_url && (
          <img
            src={empresa.imagen_portada_url}
            alt={empresa.nombre}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <button
          onClick={volver}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm backdrop-blur transition-transform active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="relative z-10 -mt-10 flex flex-col items-center px-6">
        <div className="mb-3 h-20 w-20 rounded-full border-4 border-white bg-white shadow-lg shadow-welve-900/10">
          {empresa.logo_url ? (
            <img src={empresa.logo_url} alt={empresa.nombre} className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${gradiente} text-2xl font-bold text-white`}>
              {empresa.nombre.charAt(0)}
            </div>
          )}
        </div>
        <h1 className="mb-1 text-center text-2xl font-bold leading-tight text-gray-900">{empresa.nombre}</h1>
        <span className="mb-4 rounded-full bg-welve-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-welve-600">
          {empresa.rubro.replace('_', ' ')}
        </span>

        <div className="mb-6 flex items-center gap-3">
          {empresa.instagram && (
            <a
              href={socialUrl('instagram', empresa.instagram)}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm transition-transform hover:scale-110"
            >
              <Camera size={18} />
            </a>
          )}
          {empresa.facebook && (
            <a
              href={socialUrl('facebook', empresa.facebook)}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm transition-transform hover:scale-110"
            >
              <Users size={18} />
            </a>
          )}
          {empresa.tiktok && (
            <a
              href={socialUrl('tiktok', empresa.tiktok)}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm transition-transform hover:scale-110"
            >
              <Music2 size={18} />
            </a>
          )}
        </div>

        <button
          onClick={() => navigate(isAuthenticated ? `/wallet/empresa/${empresaId}/mi-qr` : `/login?redirect=/wallet/empresa/${empresaId}/mi-qr`)}
          className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-gray-900/20 transition-transform active:scale-95"
        >
          <QrCode size={16} />
          {isAuthenticated ? 'Mostrar mi código' : 'Inicia sesión para tu código'}
        </button>
      </div>
    </div>
  );
}
