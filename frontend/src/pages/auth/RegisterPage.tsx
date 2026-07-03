import { useState } from "react";
import { Ticket, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";
import PillTabs from "../../components/auth/PillTabs";
import EmpresaRegisterWizard from "../../components/auth/register/EmpresaRegisterWizard";
import ClienteRegisterForm from "../../components/auth/register/ClienteRegisterForm";
import { Toaster } from "../../components/ui";
import { useToast } from "../../hooks/useToast";

const BENEFICIOS = [
  { icon: Ticket, label: "Gestiona tus cupones fácilmente" },
  { icon: Users, label: "Conoce a tus clientes recurrentes" },
  { icon: TrendingUp, label: "Aumenta tus ventas con lealtad" },
];

type Tab = "empresa" | "cliente";

const TAB_OPTIONS = [
  { value: "empresa" as const, label: "Registrar mi negocio" },
  { value: "cliente" as const, label: "Soy cliente" },
];

export default function RegisterPage() {
  const [tab, setTab] = useState<Tab>("empresa");
  const toast = useToast();

  return (
    <AuthSplitLayout tagline="Únete a Welve y empieza a fidelizar clientes hoy" benefits={BENEFICIOS}>
      <div className="animate-fade-up">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="mt-1 text-sm text-gray-500">Únete a Welve</p>
        </div>

        <PillTabs options={TAB_OPTIONS} value={tab} onChange={setTab} />

        <div key={tab} className="animate-fade-up">
          {tab === "empresa" ? <EmpresaRegisterWizard toast={toast} /> : <ClienteRegisterForm toast={toast} />}
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-welve-500 font-semibold hover:underline">Ingresar</Link>
        </p>
      </div>

      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </AuthSplitLayout>
  );
}
