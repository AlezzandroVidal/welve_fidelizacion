import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings, Building2, Sparkles, Phone as PhoneIcon,
  Crown, Shield, AlertTriangle, Camera,
  Globe, Mail, User, LogOut,
} from "lucide-react";
import { useEmpresaMe, useUpdateEmpresa, useUploadLogo, useDeleteLogo } from "../../hooks/useEmpresa";
import { useToast } from "../../hooks/useToast";
import { Button, Modal, Toaster, Input } from "../../components/ui";

const PLAN_LABEL: Record<string, string> = { starter: "Starter", growth: "Growth", pro: "Pro", basico: "Básico", profesional: "Profesional", enterprise: "Enterprise" };
const PLAN_LIMITS: Record<string, { clientes: number; cupones: number }> = {
  starter: { clientes: 500,   cupones: 5  },
  growth:  { clientes: 2000,  cupones: 20 },
  pro:     { clientes: 10000, cupones: 100 },
};

/* ── Helper ──────────────────────────────────────────────────────────────── */

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── Logo Modal ──────────────────────────────────────────────────────────── */

function LogoModal({
  open, onClose, currentLogo, empresaNombre, onUpload, onDelete, isLoading,
}: {
  open: boolean;
  onClose: () => void;
  currentLogo: string | null;
  empresaNombre: string;
  onUpload: (dataUri: string) => void;
  onDelete: () => void;
  isLoading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileErr, setFileErr] = useState("");

  useEffect(() => {
    if (open) { setPreview(null); setFileErr(""); }
  }, [open]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { setFileErr("La imagen supera 2 MB"); return; }
    setFileErr("");
    const uri = await fileToDataUri(f);
    setPreview(uri);
  }

  const displayed = preview ?? currentLogo;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Foto de la empresa"
      size="sm"
      footer={
        <div className="flex items-center gap-2 w-full">
          {currentLogo && !preview && (
            <Button variant="danger" onClick={onDelete} loading={isLoading} className="mr-auto">
              Eliminar foto
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="ml-auto">
            Cancelar
          </Button>
          {preview ? (
            <Button onClick={() => onUpload(preview)} loading={isLoading}>
              Guardar foto
            </Button>
          ) : (
            <Button onClick={() => fileRef.current?.click()}>
              {currentLogo ? "Cambiar foto" : "Subir foto"}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Preview circle */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-welve-100 shadow-lg cursor-pointer group"
            onClick={() => fileRef.current?.click()}
          >
            {displayed ? (
              <img src={displayed} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-welve-100 flex items-center justify-center">
                <span className="text-5xl font-black text-welve-400">
                  {empresaNombre[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={22} className="text-white mb-1" />
              <span className="text-white text-[10px] font-medium">
                {displayed ? "Cambiar" : "Subir"}
              </span>
            </div>
          </div>

          {preview && (
            <p className="text-xs text-welve-600 font-medium animate-fade-in text-center">
              Nueva imagen seleccionada — haz clic en "Guardar foto" para confirmar
            </p>
          )}
          {!displayed && (
            <p className="text-xs text-gray-400 text-center">
              Haz clic en el círculo o el botón para subir tu logo
            </p>
          )}
        </div>

        {fileErr && <p className="text-xs text-red-500 text-center">{fileErr}</p>}

        <p className="text-[11px] text-gray-400 text-center">JPG, PNG o WebP · máx. 2 MB</p>

        {preview && (
          <button
            className="text-xs text-gray-400 hover:text-gray-600 underline w-full text-center"
            onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
          >
            Descartar cambio
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </Modal>
  );
}

/* ── Sección 1: Perfil ───────────────────────────────────────────────────── */

const perfilSchema = z.object({
  nombre:            z.string().min(2, "Mínimo 2 caracteres"),
  telefono_contacto: z.string().optional(),
});
type PerfilData = z.infer<typeof perfilSchema>;

function SeccionPerfil({ empresa, onSaved }: { empresa: NonNullable<ReturnType<typeof useEmpresaMe>["data"]>; onSaved: (msg: string) => void }) {
  const update     = useUpdateEmpresa();
  const uploadLogo = useUploadLogo();
  const deleteLogo = useDeleteLogo();
  const [logoModalOpen, setLogoModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PerfilData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nombre: empresa.nombre, telefono_contacto: empresa.telefonoContacto ?? "" },
  });
  useEffect(() => { reset({ nombre: empresa.nombre, telefono_contacto: empresa.telefonoContacto ?? "" }); }, [empresa, reset]);

  async function onSubmit(d: PerfilData) {
    await update.mutateAsync({ nombre: d.nombre, telefono_contacto: d.telefono_contacto });
    onSaved("Perfil actualizado");
  }

  async function handleUpload(dataUri: string) {
    await uploadLogo.mutateAsync(dataUri);
    setLogoModalOpen(false);
    onSaved("Logo actualizado correctamente");
  }

  async function handleDelete() {
    await deleteLogo.mutateAsync();
    setLogoModalOpen(false);
    onSaved("Logo eliminado");
  }

  const logoIsLoading = uploadLogo.isPending || deleteLogo.isPending;

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
        <Input
          {...register("nombre")}
          label="Nombre comercial"
          icon={<User size={14} />}
          error={errors.nombre?.message}
        />
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
        onUpload={handleUpload}
        onDelete={handleDelete}
        isLoading={logoIsLoading}
      />
    </div>
  );
}

/* ── Sección 2: Fidelización ─────────────────────────────────────────────── */

function SeccionFidelizacion({ empresa, onSaved }: { empresa: NonNullable<ReturnType<typeof useEmpresaMe>["data"]>; onSaved: (msg: string) => void }) {
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

      <Button onClick={save} loading={update.isPending}>Guardar reglas</Button>
    </div>
  );
}

/* ── Sección 3: Contacto ─────────────────────────────────────────────────── */

function SeccionContacto({ onSaved }: { onSaved: (msg: string) => void }) {
  function save(e: React.FormEvent) { e.preventDefault(); onSaved("Datos de contacto guardados"); }

  return (
    <form onSubmit={save} className="space-y-4 max-w-lg">
      <Input label="Dirección" placeholder="Jr. Las Flores 123, Miraflores" onChange={() => {}} />
      <Input label="Horario de atención" placeholder="Lun–Vie 9am–6pm, Sáb 10am–2pm" onChange={() => {}} />
      <div className="grid grid-cols-3 gap-3">
        <Input label="Instagram" icon={<Globe size={14} />} placeholder="@mi_negocio" onChange={() => {}} />
        <Input label="Facebook"  icon={<Globe size={14} />} placeholder="mi.negocio"  onChange={() => {}} />
        <Input label="TikTok"    icon={<Globe size={14} />} placeholder="@mi_negocio" onChange={() => {}} />
      </div>
      <Button type="submit">Guardar contacto</Button>
    </form>
  );
}

/* ── Sección 4: Plan ─────────────────────────────────────────────────────── */

function SeccionPlan({ plan }: { plan: string }) {
  const limits = PLAN_LIMITS[plan] ?? { clientes: 500, cupones: 5 };
  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-xl bg-[#1E1B2E] p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Crown size={16} className="text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Plan actual</span>
        </div>
        <p className="text-2xl font-black">{PLAN_LABEL[plan] ?? plan}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xl font-black">{limits.clientes.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Clientes</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-xl font-black">{limits.cupones}</p>
            <p className="text-xs text-gray-400">Cupones activos</p>
          </div>
        </div>
      </div>
      <Button variant="secondary">Ver todos los planes</Button>
    </div>
  );
}

/* ── Sección 5: Seguridad ────────────────────────────────────────────────── */

function SeccionSeguridad({ onSaved }: { onSaved: (msg: string) => void }) {
  function changePw(e: React.FormEvent) { e.preventDefault(); onSaved("Contraseña actualizada"); }

  return (
    <div className="max-w-lg space-y-6">
      <form onSubmit={changePw} className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800">Cambiar contraseña</h3>
        <Input variant="password" label="Contraseña actual"    placeholder="••••••••"                onChange={() => {}} />
        <Input variant="password" label="Nueva contraseña"     placeholder="Mínimo 8 caracteres"    onChange={() => {}} />
        <Input variant="password" label="Confirmar contraseña" placeholder="Repite la nueva"        onChange={() => {}} />
        <Button type="submit">Actualizar contraseña</Button>
      </form>
      <div className="border-t border-gray-100 pt-4">
        <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors">
          <LogOut size={14} /> Cerrar todas las sesiones activas
        </button>
      </div>
    </div>
  );
}

/* ── Sección 6: Zona de peligro ──────────────────────────────────────────── */

function SeccionPeligro({ nombre }: { nombre: string }) {
  const [showModal, setShowModal] = useState(false);
  const [confirm,  setConfirm]   = useState("");

  return (
    <div className="max-w-lg">
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-red-500" />
          <h3 className="text-sm font-bold text-red-700">Eliminar cuenta</h3>
        </div>
        <p className="text-xs text-red-600 mb-4">Esta acción es permanente e irreversible. Se eliminarán todos tus datos, clientes y configuraciones.</p>
        <Button variant="danger" onClick={() => setShowModal(true)}>Eliminar mi cuenta</Button>
      </div>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setConfirm(""); }}
        title="Confirmar eliminación"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowModal(false); setConfirm(""); }}>Cancelar</Button>
            <Button variant="danger" disabled={confirm !== nombre}>Eliminar permanentemente</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Para confirmar, escribe el nombre de tu empresa:</p>
          <p className="font-bold text-gray-900 text-sm bg-gray-50 rounded-lg px-3 py-2">{nombre}</p>
          <Input
            value={confirm}
            onChange={(e) => setConfirm((e.target as HTMLInputElement).value)}
            placeholder="Escribe aquí..."
          />
        </div>
      </Modal>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

const SECCIONES = [
  { key: "perfil",        label: "Perfil del negocio",    icon: Building2     },
  { key: "fidelizacion",  label: "Fidelización",          icon: Sparkles      },
  { key: "contacto",      label: "Datos de contacto",     icon: PhoneIcon     },
  { key: "plan",          label: "Plan de suscripción",   icon: Crown         },
  { key: "seguridad",     label: "Seguridad",             icon: Shield        },
  { key: "peligro",       label: "Zona de peligro",       icon: AlertTriangle },
];

export default function ConfigPage() {
  const { data: empresa, isLoading } = useEmpresaMe();
  const toast = useToast();
  const [tab, setTab] = useState("perfil");

  if (isLoading) return <div className="p-6 text-gray-400 text-sm">Cargando configuración...</div>;
  if (!empresa)  return <div className="p-6 text-red-500 text-sm">No se pudo cargar la configuración.</div>;

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
          <p className="text-xs text-gray-400">{empresa.nombre}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <aside className="w-full md:w-56 shrink-0">
          <nav className="flex flex-col gap-1">
            {SECCIONES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left
                  ${tab === key
                    ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                    : "text-gray-500 hover:bg-white/60 hover:text-gray-700"}
                  ${key === "peligro" ? "text-red-500 hover:text-red-600" : ""}`}
              >
                <Icon size={16} className={tab === key ? "text-welve-500" : "text-gray-400"} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 rounded-[16px] border border-gray-100 bg-white p-6 shadow-sm animate-fade-up min-h-[400px]">
          {tab === "perfil"       && <SeccionPerfil       empresa={empresa} onSaved={toast.success} />}
          {tab === "fidelizacion" && <SeccionFidelizacion empresa={empresa} onSaved={toast.success} />}
          {tab === "contacto"     && <SeccionContacto     onSaved={toast.success} />}
          {tab === "plan"         && <SeccionPlan         plan={empresa.planSuscripcion} />}
          {tab === "seguridad"    && <SeccionSeguridad    onSaved={toast.success} />}
          {tab === "peligro"      && <SeccionPeligro      nombre={empresa.nombre} />}
        </div>
      </div>

      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}
