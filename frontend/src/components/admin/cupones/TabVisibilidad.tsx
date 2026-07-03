import { useState } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Globe, Star, Trophy, BarChart3, Lock, Search, X } from "lucide-react";
import { Input, SelectField, Checkbox, TextareaField } from "../../ui";
import { useRetos } from "../../../hooks/useRetos";
import { useProductos } from "../../../hooks/useProductos";
import type { AccesoVisibilidad, TipoRequisito } from "../../../api/cupones";
import type { CuponFormData } from "./cuponFormSchema";

const OPCIONES: { value: AccesoVisibilidad; label: string; hint: string; icon: React.ReactElement }[] = [
  { value: "publico",       label: "Público",        hint: "Todos los clientes lo ven y pueden usarlo",             icon: <Globe size={18} /> },
  { value: "vip",           label: "Solo VIP",       hint: "Clientes en segmento \"exclusivo\"",                    icon: <Star size={18} /> },
  { value: "por_reto",      label: "Por reto",       hint: "Se desbloquea al completar un reto",                    icon: <Trophy size={18} /> },
  { value: "por_requisito", label: "Por requisito",  hint: "Se desbloquea al cumplir una condición",                icon: <BarChart3 size={18} /> },
  { value: "privado",       label: "Privado",        hint: "Va directo a cuponera al desbloquearse, sin mostrarse", icon: <Lock size={18} /> },
];

const TIPOS_REQUISITO: { value: TipoRequisito; label: string }[] = [
  { value: "visitas_totales",   label: "Visitas totales" },
  { value: "visitas_en_periodo",label: "Visitas en período" },
  { value: "gasto_total",       label: "Gasto total (S/)" },
  { value: "gasto_en_periodo",  label: "Gasto en período (S/)" },
  { value: "gasto_en_productos",label: "Gasto en productos/categoría (S/)" },
  { value: "puntos_acumulados", label: "Puntos acumulados" },
];

const CON_PERIODO: TipoRequisito[] = ["visitas_en_periodo", "gasto_en_periodo", "gasto_en_productos"];
const CON_DESBLOQUEO: AccesoVisibilidad[] = ["por_reto", "por_requisito", "privado"];

interface Props {
  register: UseFormRegister<CuponFormData>;
  errors: FieldErrors<CuponFormData>;
  visibilidad: AccesoVisibilidad;
  onVisibilidadChange: (v: AccesoVisibilidad) => void;
  requisitoTipo: TipoRequisito | "";
  requisitoProductoObjetivoId: string;
  onRequisitoProductoObjetivoChange: (id: string) => void;
}

export default function TabVisibilidad({
  register, errors, visibilidad, onVisibilidadChange, requisitoTipo,
  requisitoProductoObjetivoId, onRequisitoProductoObjetivoChange,
}: Props) {
  const { data: retos } = useRetos();
  const { data: productos = [] } = useProductos();
  const [busqueda, setBusqueda] = useState("");
  const productoSel = productos.find((p) => p.id === requisitoProductoObjetivoId);
  const resultados = busqueda.trim()
    ? productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase())).slice(0, 6)
    : [];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {OPCIONES.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors ${
              visibilidad === opt.value ? "border-welve-500 bg-welve-50" : "border-gray-200"
            }`}
          >
            <input type="radio" className="mt-0.5" checked={visibilidad === opt.value} onChange={() => onVisibilidadChange(opt.value)} />
            <span className={`mt-0.5 ${visibilidad === opt.value ? "text-welve-600" : "text-gray-400"}`}>{opt.icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
              <p className="text-xs text-gray-400">{opt.hint}</p>
            </div>
          </label>
        ))}
      </div>

      {visibilidad === "por_reto" && (
        <div>
          <SelectField {...register("reto_id")} label="¿Qué reto debe completar? (opcional)" error={errors.reto_id?.message}>
            <option value="">Sin asignar todavía...</option>
            {retos?.filter((r) => !r.cancelado).map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </SelectField>
          <p className="mt-1.5 text-[11px] text-gray-400">
            Si el reto todavía no existe, guarda el cupón así y asígnalo después desde el
            formulario de ese reto (pestaña "Cupones que desbloquea") — un reto puede
            desbloquear varios cupones a la vez.
          </p>
        </div>
      )}

      {visibilidad === "por_requisito" && (
        <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <SelectField {...register("requisito_tipo")} label="Tipo de requisito">
            <option value="">Seleccionar...</option>
            {TIPOS_REQUISITO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </SelectField>
          <div className="grid grid-cols-2 gap-4">
            <Input {...register("requisito_valor")} type="number" step="0.01" min="0"
              label="Valor requerido" error={errors.requisito_valor?.message} />
            {requisitoTipo && CON_PERIODO.includes(requisitoTipo) && requisitoTipo !== "gasto_en_productos" && (
              <Input {...register("requisito_periodo_dias")} type="number" min="1"
                label="Período (días)" placeholder="Ej. 30" error={errors.requisito_periodo_dias?.message} />
            )}
          </div>

          {requisitoTipo === "gasto_en_productos" && (
            <div className="space-y-3">
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">Producto específico</span>
                {productoSel ? (
                  <span className="flex w-fit items-center gap-1.5 rounded-full bg-welve-100 py-1 pl-3 pr-1.5 text-xs font-medium text-welve-700">
                    {productoSel.nombre}
                    <button type="button" onClick={() => onRequisitoProductoObjetivoChange("")} className="rounded-full p-0.5 hover:bg-welve-200">
                      <X size={11} />
                    </button>
                  </span>
                ) : (
                  <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar producto por nombre..."
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition-colors focus:border-welve-500 focus:ring-[3px] focus:ring-welve-500/20"
                    />
                    {resultados.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                        {resultados.map((p) => (
                          <button key={p.id} type="button"
                            onClick={() => { onRequisitoProductoObjetivoChange(p.id); setBusqueda(""); }}
                            className="flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-gray-50">
                            <span>{p.nombre}</span>
                            <span className="text-[10px] text-gray-400">{p.sku}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <SelectField {...register("requisito_categoria_objetivo")} label="…o por categoría" hint="Alternativa a elegir un producto específico">
                <option value="">Sin categoría</option>
                {[...new Set(productos.map((p) => p.categoria).filter((c): c is string => !!c))].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </SelectField>
              <Input {...register("requisito_periodo_dias")} type="number" min="1"
                label="Período (días) — opcional" placeholder="Sin límite de tiempo" error={errors.requisito_periodo_dias?.message} />
              <p className="text-[11px] text-gray-400">
                Solo cuenta compras hechas desde el módulo de Caja — una visita registrada
                por staff sin venta asociada no queda incluida.
              </p>
            </div>
          )}
        </div>
      )}

      {CON_DESBLOQUEO.includes(visibilidad) && (
        <>
          <Checkbox
            {...register("notificar_al_desbloquear")}
            label="Notificar al cliente cuando se desbloquee"
            description="Le llega una notificación en-app apenas cumple la condición"
          />
          <TextareaField
            {...register("mensaje_notificacion")}
            label="Mensaje de notificación (opcional)"
            placeholder="Default: '¡Desbloqueaste este cupón!'"
            rows={2}
          />
          {visibilidad === "por_reto" && (
            <p className="text-[11px] text-gray-400">
              El progreso visible antes de desbloquear se controla desde el reto asociado
              (toggle "Mostrar progreso al cliente" en su formulario).
            </p>
          )}
        </>
      )}
    </div>
  );
}
