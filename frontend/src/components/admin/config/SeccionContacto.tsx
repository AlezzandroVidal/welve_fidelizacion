import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe } from "lucide-react";
import { useEmpresaMe, useUpdateEmpresa } from "../../../hooks/useEmpresa";
import { Button, Input } from "../../ui";
import EmpresaMapPicker from "../../maps/EmpresaMapPicker";

const contactoSchema = z.object({
  descripcion: z.string().optional(),
  direccion:   z.string().optional(),
  horario:     z.string().optional(),
  instagram:   z.string().optional(),
  facebook:    z.string().optional(),
  tiktok:      z.string().optional(),
  sitio_web:   z.string().optional(),
});
type ContactoData = z.infer<typeof contactoSchema>;

type Empresa = NonNullable<ReturnType<typeof useEmpresaMe>["data"]>;

export default function SeccionContacto({ empresa, onSaved }: { empresa: Empresa; onSaved: (msg: string) => void }) {
  const update = useUpdateEmpresa();
  const [lat, setLat] = useState<number | null>(empresa.latitud);
  const [lng, setLng] = useState<number | null>(empresa.longitud);
  const { register, handleSubmit, reset } = useForm<ContactoData>({
    resolver: zodResolver(contactoSchema),
    defaultValues: {
      descripcion: empresa.descripcion ?? "",
      direccion:   empresa.direccion ?? "",
      horario:     empresa.horario ?? "",
      instagram:   empresa.instagram ?? "",
      facebook:    empresa.facebook ?? "",
      tiktok:      empresa.tiktok ?? "",
      sitio_web:   empresa.sitioWeb ?? "",
    },
  });
  useEffect(() => {
    reset({
      descripcion: empresa.descripcion ?? "",
      direccion:   empresa.direccion ?? "",
      horario:     empresa.horario ?? "",
      instagram:   empresa.instagram ?? "",
      facebook:    empresa.facebook ?? "",
      tiktok:      empresa.tiktok ?? "",
      sitio_web:   empresa.sitioWeb ?? "",
    });
    setLat(empresa.latitud);
    setLng(empresa.longitud);
  }, [empresa, reset]);

  async function onSubmit(d: ContactoData) {
    await update.mutateAsync({
      ...d,
      ...(lat !== null && lng !== null ? { latitud: lat, longitud: lng } : {}),
    });
    onSaved("Datos de contacto guardados");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <Input {...register("descripcion")} label="Descripción breve" placeholder="Cafetería de especialidad en Miraflores" />
      <Input {...register("direccion")} label="Dirección" placeholder="Jr. Las Flores 123, Miraflores" />
      <Input {...register("horario")} label="Horario de atención" placeholder="Lun–Vie 9am–6pm, Sáb 10am–2pm" />
      <Input {...register("sitio_web")} label="Sitio web" icon={<Globe size={14} />} placeholder="https://mi-negocio.pe" />

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-700">Ubicación en el mapa</label>
        <EmpresaMapPicker lat={lat} lng={lng} onChange={(la, lo) => { setLat(la); setLng(lo); }} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input {...register("instagram")} label="Instagram" icon={<Globe size={14} />} placeholder="@mi_negocio" />
        <Input {...register("facebook")} label="Facebook" icon={<Globe size={14} />} placeholder="mi.negocio" />
        <Input {...register("tiktok")} label="TikTok" icon={<Globe size={14} />} placeholder="@mi_negocio" />
      </div>
      <Button type="submit" loading={update.isPending}>Guardar contacto</Button>
    </form>
  );
}
