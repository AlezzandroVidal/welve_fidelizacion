import { Lock } from "lucide-react";

interface Props {
  /** Acepta el shape snake_case de los endpoints tipo-dict de wallet_service
   * (mismo criterio que CuponCardMini.tsx) — cupón con `acceso` embebido. */
  cupon: any;
  empresaNombre?: string;
  size?: "mini" | "full";
}

/** Cupón que el cliente todavía no puede canjear pero sí ver su progreso
 * (visibilidad por_reto/por_requisito, mostrar_progreso=True) — bloqueado
 * visualmente con candado y barra de progreso. Usado en tamaño "mini" en el
 * carrusel de Inicio y "full" en el tab "En progreso" de MisCuponesPage. */
export default function CuponProgresoCard({ cupon, empresaNombre, size = "full" }: Props) {
  const nombreEmpresa = empresaNombre ?? cupon.empresa?.nombre;
  const acceso = cupon.acceso ?? {};
  const porcentaje = Math.min(100, acceso.progreso_porcentaje ?? 0);
  const mensaje = acceso.mensaje || "Sigue visitando para desbloquearlo";

  const contenido = (
    <>
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900/10 text-gray-500">
          <Lock size={13} />
        </div>
        {nombreEmpresa && <span className="truncate text-[11px] font-medium text-gray-400">{nombreEmpresa}</span>}
      </div>
      <p className="truncate text-sm font-bold text-gray-700">{cupon.nombre}</p>
      <div className="my-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-gray-400 transition-all" style={{ width: `${porcentaje}%` }} />
      </div>
      <p className="text-[11px] font-medium text-gray-400">{mensaje}</p>
    </>
  );

  if (size === "mini") {
    return (
      <div className="w-44 flex-shrink-0 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100 p-3.5 opacity-90">
        {contenido}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100 p-4 opacity-90">
      {contenido}
    </div>
  );
}
