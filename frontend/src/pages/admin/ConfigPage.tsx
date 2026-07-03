import { useState } from "react";
import { Settings, Building2, Sparkles, Phone as PhoneIcon, Crown, Shield, AlertTriangle } from "lucide-react";
import { useEmpresaMe } from "../../hooks/useEmpresa";
import { useToast } from "../../hooks/useToast";
import { Toaster } from "../../components/ui";
import SeccionPerfil from "../../components/admin/config/SeccionPerfil";
import SeccionFidelizacion from "../../components/admin/config/SeccionFidelizacion";
import SeccionContacto from "../../components/admin/config/SeccionContacto";
import SeccionPlan from "../../components/admin/config/SeccionPlan";
import SeccionSeguridad from "../../components/admin/config/SeccionSeguridad";
import SeccionPeligro from "../../components/admin/config/SeccionPeligro";

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

        <div className="flex-1 rounded-[16px] border border-gray-100 bg-white p-6 shadow-sm animate-fade-up min-h-[400px]">
          {tab === "perfil"       && <SeccionPerfil       empresa={empresa} onSaved={toast.success} />}
          {tab === "fidelizacion" && <SeccionFidelizacion empresa={empresa} onSaved={toast.success} />}
          {tab === "contacto"     && <SeccionContacto     empresa={empresa} onSaved={toast.success} />}
          {tab === "plan"         && <SeccionPlan         plan={empresa.planSuscripcion} />}
          {tab === "seguridad"    && <SeccionSeguridad    onSaved={toast.success} />}
          {tab === "peligro"      && <SeccionPeligro      nombre={empresa.nombre} />}
        </div>
      </div>

      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}
