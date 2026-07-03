import { useState } from "react";
import { Flame, Clock, CalendarDays, TrendingUp, Coins, User, Ticket } from "lucide-react";
import { useCanjesCliente } from "../../../hooks/useCanjes";
import type { Cliente } from "../../../api/clientes";
import { Badge } from "../../ui";
import TabCuponesCliente from "./TabCuponesCliente";

const AVATAR_COLORS = [
  "bg-welve-500", "bg-blue-500", "bg-green-500",
  "bg-orange-500", "bg-pink-500", "bg-teal-500", "bg-indigo-500",
];

function hashColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + (h << 5) - h;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const S = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-9 w-9 text-xs";
  return (
    <div className={`${S} ${hashColor(name)} flex-shrink-0 flex items-center justify-center rounded-full font-bold text-white`}>
      {initials(name)}
    </div>
  );
}

type Tab = "perfil" | "cupones";

export default function ClienteDetalle({ cliente }: { cliente: Cliente }) {
  const [tab, setTab] = useState<Tab>("perfil");
  const { data: canjes } = useCanjesCliente(cliente.id);
  const historial = (canjes ?? []).slice(0, 10);

  const semanas = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (7 - i) * 7);
    return d;
  });

  return (
    <div className="space-y-5">
      {/* Header con avatar */}
      <div className="flex items-center gap-4">
        <Avatar name={cliente.nombre} size="lg" />
        <div>
          <h3 className="text-base font-bold text-gray-900">{cliente.nombre}</h3>
          <p className="font-mono text-xs font-semibold text-welve-600">{cliente.codigoCliente}</p>
          {cliente.email    && <p className="text-xs text-gray-400">{cliente.email}</p>}
          {cliente.whatsapp && <p className="text-xs text-gray-400">{cliente.whatsapp}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-full bg-gray-50 p-1">
        {[
          { id: "perfil" as Tab, label: "Perfil", icon: User },
          { id: "cupones" as Tab, label: "Cupones", icon: Ticket },
        ].map((t) => (
          <button
            key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-bold transition-colors ${
              tab === t.id ? "bg-white text-welve-700 shadow-sm" : "text-gray-500"
            }`}
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "cupones" && <TabCuponesCliente clienteId={cliente.id} />}

      {tab === "perfil" && (
        <>
          <div>
            {cliente.segmento === "exclusivo" ? (
              <Badge color="orange" dot>Exclusivo</Badge>
            ) : (
              <Badge color="gray" dot>Regular</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Visitas totales", value: cliente.visitasTotales, icon: TrendingUp, color: "text-blue-500" },
              { label: "Puntos",          value: cliente.puntos,         icon: Coins,      color: "text-welve-500" },
              { label: "Racha actual",    value: `${cliente.rachaActual} días`, icon: Flame, color: "text-orange-500" },
              { label: "Monto acumulado", value: `S/ ${cliente.montoAcumulado.toFixed(0)}`, icon: Coins, color: "text-green-500" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-50 p-3">
                <s.icon size={14} className={`${s.color} mb-1.5`} />
                <p className="text-lg font-black text-gray-900 tabular leading-none">{s.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Racha (8 semanas)</p>
            <div className="flex gap-1.5">
              {semanas.map((_, i) => (
                <div
                  key={i}
                  title={`Semana ${i + 1}`}
                  className={`h-6 flex-1 rounded-md transition-all ${i < cliente.rachaActual ? "bg-orange-400" : "bg-gray-100"}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-gray-300">8 sem. atrás</span>
              <span className="text-[9px] text-gray-300">hoy</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-gray-500"><Clock size={13} /> Última visita</span>
              <span className="font-medium text-gray-800">{fmtDate(cliente.ultimaVisita)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-gray-500"><CalendarDays size={13} /> Cliente desde</span>
              <span className="font-medium text-gray-800">{fmtDate(cliente.fechaAlta)}</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Últimos canjes</p>
            {!historial.length ? (
              <p className="text-sm text-gray-400 py-4 text-center">Sin canjes registrados</p>
            ) : (
              <ul className="space-y-1.5">
                {historial.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-xs">
                    <span className="font-medium text-gray-700 truncate">{c.cuponNombre ?? "Cupón eliminado"}</span>
                    <span className="text-gray-400 flex-shrink-0 ml-2">
                      {new Date(c.fecha).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
