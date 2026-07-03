import { useEffect, useState } from "react";
import { QrCode, Link as LinkIcon, UserCheck, Sparkles } from "lucide-react";
import type { Canje } from "../../api/canjes";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return "ahora";
  if (mins  < 60) return `hace ${mins}min`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

const AVATAR_COLORS = [
  "bg-welve-500", "bg-blue-500", "bg-green-500",
  "bg-orange-500", "bg-pink-500", "bg-teal-500",
];

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + (hash << 5) - hash;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const CANAL_ICONS: Record<string, { icon: typeof QrCode; color: string }> = {
  qr:           { icon: QrCode,    color: "text-blue-500"   },
  magic_link:   { icon: LinkIcon,  color: "text-purple-500" },
  staff_manual: { icon: UserCheck, color: "text-welve-500"  },
  automatico:   { icon: Sparkles,  color: "text-green-500"  },
};

interface Props {
  data: Canje[] | undefined;
}

/** Bare — vive dentro de Widget.tsx (ActividadRecienteWidget). Solo se usa ahí.
 * El re-render cada 30s no vuelve a pedir datos, solo refresca los textos de
 * "hace Xmin" (el auto-refresh real de datos, cada 60s, vive en el widget). */
export default function RecentActivity({ data }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const recent = data?.slice(0, 8) ?? [];

  if (!recent.length) {
    return <p className="py-12 text-center text-sm text-gray-400">Sin actividad reciente</p>;
  }

  return (
    <ul className="-mx-5 -mb-5 divide-y divide-gray-50">
      {recent.map((c, i) => {
        const name = c.clienteNombre ?? "Cliente";
        const CanalIcon = CANAL_ICONS[c.canal]?.icon ?? QrCode;
        const canalColor = CANAL_ICONS[c.canal]?.color ?? "text-gray-400";

        return (
          <li
            key={c.id}
            className="relative flex items-center gap-3 px-5 py-3.5 pl-6 transition-colors duration-100 hover:bg-welve-50/40 animate-fade-up before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-welve-500/20"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${hashColor(name)}`}>
              {initials(name)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">
                {name} <span className="font-normal text-gray-400">canjeó {c.cuponNombre ?? "un cupón eliminado"}</span>
              </p>
            </div>

            <div className="flex flex-shrink-0 flex-col items-end gap-1">
              <CanalIcon size={14} className={canalColor} />
              <span className="text-[10px] text-gray-400 tabular-nums">{relativeTime(c.fecha)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
