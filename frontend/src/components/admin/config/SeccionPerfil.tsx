import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Phone as PhoneIcon, Mail, User } from "lucide-react";
import {
  useEmpresaMe, useUpdateEmpresa, useUploadLogo, useDeleteLogo,
  useUploadPortada, useDeletePortada,
} from "../../../hooks/useEmpresa";
import { Button, Input, SelectField } from "../../ui";
import LogoModal from "./LogoModal";
import PortadaModal from "./PortadaModal";

const RUBROS = [
  { value: "food_beverage", label: "Comida y bebida"     },
  { value: "belleza",       label: "Belleza y cuidado"   },
  { value: "retail",        label: "Retail / tienda"     },
  { value: "otro",          label: "Otro"                },
];

const perfilSchema = z.object({
  nombre:            z.string().min(2, "Mínimo 2 caracteres"),
  rubro:             z.enum(["food_beverage", "belleza", "retail", "otro"]),
  telefono_contacto: z.string().optional(),
});
type PerfilData = z.infer<typeof perfilSchema>;

type Empresa = NonNullable<ReturnType<typeof useEmpresaMe>["data"]>;

export default function SeccionPerfil({ empresa, onSaved }: { empresa: Empresa; onSaved: (msg: string) => void }) {
  const update        = useUpdateEmpresa();
  const uploadLogo    = useUploadLogo();
  const deleteLogo    = useDeleteLogo();
  const uploadPortada = useUploadPortada();
  const deletePortada = useDeletePortada();
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [portadaModalOpen, setPortadaModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PerfilData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nombre: empresa.nombre, rubro: empresa.rubro as PerfilData["rubro"], telefono_contacto: empresa.telefonoContacto ?? "" },
  });
  useEffect(() => {
    reset({ nombre: empresa.nombre, rubro: empresa.rubro as PerfilData["rubro"], telefono_contacto: empresa.telefonoContacto ?? "" });
  }, [empresa, reset]);

  async function onSubmit(d: PerfilData) {
    await update.mutateAsync({ nombre: d.nombre, rubro: d.rubro, telefono_contacto: d.telefono_contacto });
    onSaved("Perfil actualizado");
  }

  async function handleUploadLogo(dataUri: string) {
    await uploadLogo.mutateAsync(dataUri);
    setLogoModalOpen(false);
    onSaved("Logo actualizado correctamente");
  }

  async function handleDeleteLogo() {
    await deleteLogo.mutateAsync();
    setLogoModalOpen(false);
    onSaved("Logo eliminado");
  }

  async function handleUploadPortada(dataUri: string) {
    await uploadPortada.mutateAsync(dataUri);
    setPortadaModalOpen(false);
    onSaved("Portada actualizada correctamente");
  }

  async function handleDeletePortada() {
    await deletePortada.mutateAsync();
    setPortadaModalOpen(false);
    onSaved("Portada eliminada");
  }

  const logoIsLoading = uploadLogo.isPending || deleteLogo.isPending;
  const portadaIsLoading = uploadPortada.isPending || deletePortada.isPending;

  return (
    <div className="space-y-5">
      {/* Logo */}
      <div>
        <p className="mb-1.5 block text-xs font-semibold text-gray-700">Logo del negocio</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setLogoModalOpen(true)}
            className="relative h-16 w-16 rounded-full bg-welve-100 flex items-center justify-center cursor-pointer overflow-hidden group border-2 border-welve-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-welve-500"
          >
            {empresa.logoUrl ? (
              <img src={empresa.logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-welve-500">{empresa.nombre[0]}</span>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={16} className="text-white" />
            </div>
          </button>
          <div>
            <button
              type="button"
              onClick={() => setLogoModalOpen(true)}
              className="text-sm text-welve-600 font-medium hover:underline"
            >
              {empresa.logoUrl ? "Cambiar foto" : "Subir foto"}
            </button>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG — máx. 2 MB</p>
          </div>
        </div>
      </div>

      {/* Portada */}
      <div>
        <p className="mb-1.5 block text-xs font-semibold text-gray-700">Imagen de portada</p>
        <button
          type="button"
          onClick={() => setPortadaModalOpen(true)}
          className="group relative flex h-28 w-full max-w-lg items-center justify-center overflow-hidden rounded-xl border-2 border-welve-200 bg-welve-50"
        >
          {empresa.imagenPortadaUrl ? (
            <img src={empresa.imagenPortadaUrl} alt="Portada" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-welve-400">
              <Camera size={20} />
              <span className="text-xs font-medium">Subir portada (16:9)</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <p className="mt-0.5 text-xs text-gray-400">Se muestra como fondo del encabezado en la app del cliente</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
        <Input
          {...register("nombre")}
          label="Nombre comercial"
          icon={<User size={14} />}
          error={errors.nombre?.message}
        />
        <SelectField {...register("rubro")} label="Rubro" error={errors.rubro?.message}>
          {RUBROS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </SelectField>
        <Input
          {...register("telefono_contacto")}
          label="Teléfono de contacto"
          icon={<PhoneIcon size={14} />}
          placeholder="+51 987654321"
        />
        <Input
          value={empresa.adminEmail}
          label="Correo administrador"
          icon={<Mail size={14} />}
          disabled
          hint="No modificable desde aquí"
          onChange={() => {}}
        />
        <Button type="submit" loading={update.isPending}>Guardar cambios</Button>
      </form>

      <LogoModal
        open={logoModalOpen}
        onClose={() => setLogoModalOpen(false)}
        currentLogo={empresa.logoUrl ?? null}
        empresaNombre={empresa.nombre}
        onUpload={handleUploadLogo}
        onDelete={handleDeleteLogo}
        isLoading={logoIsLoading}
      />

      <PortadaModal
        open={portadaModalOpen}
        onClose={() => setPortadaModalOpen(false)}
        currentPortada={empresa.imagenPortadaUrl ?? null}
        empresaNombre={empresa.nombre}
        onUpload={handleUploadPortada}
        onDelete={handleDeletePortada}
        isLoading={portadaIsLoading}
      />
    </div>
  );
}
