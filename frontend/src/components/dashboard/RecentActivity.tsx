import { QrCode, Link as LinkIcon, UserCheck } from "lucide-react";
import { Card } from "../ui";
import { Skeleton } from "../ui";
import { useCanjes } from "../../hooks/useCanjes";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

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
};

/* ── Component ───────────────────────────────────────────────────────────── */

export default function RecentActivity() {
  const { data: canjes, isLoading } = useCanjes();

  const recent = canjes?.slice(0, 10) ?? [];

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="text-sm font-bold text-gray-900">Actividad reciente</h3>
        <p className="text-xs text-gray-400 mt-0.5">Últimos canjes registrados</p>
      </div>

      {isLoading ? (
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton variant="circle" width={32} height={32} />
              <div className="flex-1 space-y-1.5">
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="60%" />
              </div>
              <Skeleton variant="text" width={48} />
            </div>
          ))}
        </div>
      ) : !recent.length ? (
        <p className="py-12 text-center text-sm text-gray-400">Sin actividad reciente</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {recent.map((c, i) => {
            const name      = c.clienteNombre ?? "Cliente";
            const CanalIcon = CANAL_ICONS[c.canal]?.icon  ?? QrCode;
            const canalColor = CANAL_ICONS[c.canal]?.color ?? "text-gray-400";

            return (
              <li
                key={c.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-welve-50/40 transition-colors duration-100 animate-fade-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Avatar */}
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${hashColor(name)}`}>
                  {initials(name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                  <p className="text-xs text-gray-400 truncate">{c.cuponNombre ?? "Cupón eliminado"}</p>
                </div>

                {/* Canal + tiempo */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <CanalIcon size={14} className={canalColor} />
                  <span className="text-[10px] text-gray-400 tabular">{relativeTime(c.fecha)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
