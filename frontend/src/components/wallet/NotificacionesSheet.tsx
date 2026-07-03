import { useNavigate } from "react-router-dom";
import { Gift, Trophy, Flame, Sparkles, BellOff } from "lucide-react";
import { Sheet } from "../ui";
import {
  useNotificaciones, useMarcarNotificacionLeida, useMarcarTodasNotificacionesLeidas,
} from "../../hooks/useNotificaciones";
import type { Notificacion } from "../../api/wallet";

const ICONO_TIPO: Record<Notificacion["tipo"], React.ElementType> = {
  cupon_desbloqueado: Gift,
  reto_completado: Trophy,
  racha_en_riesgo: Flame,
  nuevo_cupon: Sparkles,
};

function relativeTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return "ahora";
  if (mins  < 60) return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificacionesSheet({ open, onClose }: Props) {
  const { data: notificaciones = [] } = useNotificaciones();
  const marcarLeida = useMarcarNotificacionLeida();
  const marcarTodas = useMarcarTodasNotificacionesLeidas();
  const navigate = useNavigate();

  function handleClick(n: Notificacion) {
    if (!n.leida) marcarLeida.mutate(n.id);
    if (n.tipo === "cupon_desbloqueado" && n.datos.cupon_id) {
      onClose();
      navigate(`/wallet/cupon/${n.datos.cupon_id}`);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Notificaciones"
      footer={
        notificaciones.some((n) => !n.leida) ? (
          <button
            onClick={() => marcarTodas.mutate()}
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 active:scale-[0.98]"
          >
            Marcar todas como leídas
          </button>
        ) : undefined
      }
    >
      {notificaciones.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <BellOff size={28} className="text-gray-300" />
          <p className="text-sm text-gray-400">No tienes notificaciones nuevas</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notificaciones.map((n) => {
            const Icono = ICONO_TIPO[n.tipo] ?? Sparkles;
            return (
              <li key={n.id}>
                <button
                  onClick={() => handleClick(n)}
                  className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-gray-50 ${
                    !n.leida ? "bg-welve-50" : ""
                  }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-welve-100 text-welve-600">
                    <Icono size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {!n.leida && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-welve-500" />}
                      <p className="truncate text-sm font-semibold text-gray-900">{n.titulo}</p>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.mensaje}</p>
                    <p className="mt-1 text-[10px] text-gray-400">{relativeTime(n.createdAt)}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
