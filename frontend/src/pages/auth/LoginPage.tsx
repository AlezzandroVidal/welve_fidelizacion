import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Ticket, Users, TrendingUp } from "lucide-react";
import AuthSplitLayout from "../../components/auth/AuthSplitLayout";
import PillTabs from "../../components/auth/PillTabs";
import EmpresaLoginForm from "../../components/auth/login/EmpresaLoginForm";
import ClienteLoginForm from "../../components/auth/login/ClienteLoginForm";
import AdminLoginForm from "../../components/auth/login/AdminLoginForm";
import { Toaster } from "../../components/ui";
import { useToast } from "../../hooks/useToast";

const BENEFICIOS = [
  { icon: Ticket, label: "Gestiona tus cupones fácilmente" },
  { icon: Users, label: "Conoce a tus clientes recurrentes" },
  { icon: TrendingUp, label: "Aumenta tus ventas con lealtad" },
];

type Tab = "empresa" | "cliente" | "admin";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const isAdminAccess = searchParams.get("admin") === "true";
  const [tab, setTab] = useState<Tab>(redirect?.startsWith("/wallet") ? "cliente" : "empresa");
  const toast = useToast();

  const tabOptions = [
    { value: "empresa" as const, label: "Empresa" },
    { value: "cliente" as const, label: "Cliente" },
    ...(isAdminAccess ? [{ value: "admin" as const, label: "Admin" }] : []),
  ];

  return (
    <AuthSplitLayout tagline="Fidelización inteligente para tu negocio" benefits={BENEFICIOS}>
      <div className="animate-fade-up">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm text-gray-500">Ingresa a tu cuenta</p>
        </div>

        <PillTabs options={tabOptions} value={tab} onChange={setTab} />

        <div key={tab} className="animate-fade-up">
          {tab === "empresa" && <EmpresaLoginForm redirect={redirect} toast={toast} />}
          {tab === "cliente" && <ClienteLoginForm toast={toast} />}
          {tab === "admin" && <AdminLoginForm toast={toast} />}
        </div>
      </div>

      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </AuthSplitLayout>
  );
}
