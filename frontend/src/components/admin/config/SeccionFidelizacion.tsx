import { useState } from "react";
import { useEmpresaMe, useUpdateEmpresa } from "../../../hooks/useEmpresa";
import { Button, Input } from "../../ui";

type Empresa = NonNullable<ReturnType<typeof useEmpresaMe>["data"]>;

export default function SeccionFidelizacion({ empresa, onSaved }: { empresa: Empresa; onSaved: (msg: string) => void }) {
  const update = useUpdateEmpresa();
  const [racha, setRacha] = useState(empresa.rachaDiasRuptura);

  async function save() {
    await update.mutateAsync({ racha_dias_ruptura: racha });
    onSaved("Configuración de fidelización actualizada");
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Días para romper racha: <span className="text-welve-600 font-black">{racha}</span></label>
        <p className="text-xs text-gray-400 mb-3">Si un cliente no visita en {racha} días, su racha se reinicia a 0</p>
        <input
          type="range" min={1} max={30} value={racha}
          onChange={(e) => setRacha(parseInt(e.target.value))}
          className="w-full accent-welve-500"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>1 día</span><span>30 días</span>
        </div>
      </div>

      <div className="space-y-4 rounded-xl bg-gray-50 p-4">
        {[
          { label: "Soles por punto", sub: "Cada S/ X gastado otorga 1 punto", field: "soles_por_punto" as const, val: empresa.solesPorPunto },
          { label: "Expiración de puntos (meses)", sub: "Los puntos sin usar expiran en X meses", field: "expiracion_meses" as const, val: empresa.expiracionMeses },
        ].map((item) => (
          <div key={item.field}>
            <Input
              type="number"
              defaultValue={item.val}
              step="0.5"
              min="0.5"
              label={item.label}
              hint={item.sub}
              className="max-w-[200px]"
              onChange={async (e) => { await update.mutateAsync({ [item.field]: parseFloat((e.target as HTMLInputElement).value) }); }}
            />
          </div>
        ))}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-gray-700">Segmento exclusivo (VIP)</p>
        <p className="mb-3 text-xs text-gray-400">
          Un cliente entra a exclusivo al alcanzar N canjes en una ventana de días, y sale si
          deja de cumplirlo por más de los días de gracia configurados.
        </p>
        <div className="space-y-4 rounded-xl bg-gray-50 p-4">
          {[
            { label: "Canjes requeridos", sub: "Cantidad de canjes dentro de la ventana", field: "umbral_exclusivo_canjes" as const, val: empresa.umbralExclusivoCanjes },
            { label: "Ventana (días)", sub: "Período móvil donde se cuentan los canjes", field: "umbral_exclusivo_dias" as const, val: empresa.umbralExclusivoDias },
            { label: "Días de gracia", sub: "Tiempo que conserva el estado VIP tras caer del umbral", field: "dias_gracia_exclusivo" as const, val: empresa.diasGraciaExclusivo },
          ].map((item) => (
            <div key={item.field}>
              <Input
                type="number"
                defaultValue={item.val}
                step="1"
                min="1"
                label={item.label}
                hint={item.sub}
                className="max-w-[200px]"
                onChange={async (e) => { await update.mutateAsync({ [item.field]: parseInt((e.target as HTMLInputElement).value, 10) }); }}
              />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={save} loading={update.isPending}>Guardar reglas</Button>
    </div>
  );
}
