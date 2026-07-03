import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { KeyRound, Mail } from "lucide-react";
import { authApi } from "../../../api/auth";
import { useAuth } from "../../../context/AuthContext";
import { Input } from "../../ui";
import AuthSubmitButton from "../AuthSubmitButton";
import type { useToast } from "../../../hooks/useToast";

type SubMode = "password" | "magic";

const passwordSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
type PasswordForm = z.infer<typeof passwordSchema>;

const magicSchema = z.object({ contacto: z.string().min(3, "Ingresa tu email o WhatsApp") });
type MagicForm = z.infer<typeof magicSchema>;

function extraerError(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback;
}

function PasswordSubForm({ toast }: { toast: ReturnType<typeof useToast> }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: PasswordForm) => {
    setServerError("");
    try {
      const res = await authApi.loginCliente(data.email, data.password);
      login(res.data.accessToken);
      toast.success("¡Bienvenido de vuelta!");
      setTimeout(() => navigate("/wallet"), 400);
    } catch (e: unknown) {
      setServerError(extraerError(e, "Email o contraseña incorrectos"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input {...register("email")} type="email" label="Email" placeholder="tu@email.com" error={errors.email?.message} />
      <Input {...register("password")} variant="password" label="Contraseña" error={errors.password?.message} />
      {serverError && <p className="text-sm text-red-500 animate-fade-up">{serverError}</p>}
      <AuthSubmitButton loading={isSubmitting} loadingLabel="Iniciando sesión...">Ingresar a la Wallet</AuthSubmitButton>
    </form>
  );
}

function MagicSubForm({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [porWhatsapp, setPorWhatsapp] = useState(false);
  const [devInfo, setDevInfo] = useState<{ devToken?: string; verifyUrl?: string } | null>(null);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<MagicForm>({ resolver: zodResolver(magicSchema) });

  const onSubmit = async (data: MagicForm) => {
    setDevInfo(null);
    try {
      const res = await authApi.solicitarMagicLink(
        porWhatsapp ? undefined : data.contacto,
        porWhatsapp ? data.contacto : undefined,
      );
      setSent(true);
      if (res.data.devToken) setDevInfo({ devToken: res.data.devToken, verifyUrl: res.data.verifyUrl });
    } catch (e: unknown) {
      toast.error(extraerError(e, "No se pudo enviar el enlace"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-1 rounded-lg bg-welve-50 p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setPorWhatsapp(false)}
          className={`flex-1 rounded-md py-1.5 transition-colors ${!porWhatsapp ? "bg-white text-welve-700 shadow-sm" : "text-gray-500"}`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setPorWhatsapp(true)}
          className={`flex-1 rounded-md py-1.5 transition-colors ${porWhatsapp ? "bg-white text-welve-700 shadow-sm" : "text-gray-500"}`}
        >
          WhatsApp
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register("contacto")}
          type={porWhatsapp ? "tel" : "email"}
          label={porWhatsapp ? "WhatsApp" : "Email"}
          placeholder={porWhatsapp ? "+51 999 000 000" : "tu@email.com"}
          icon={porWhatsapp ? <KeyRound size={16} /> : <Mail size={16} />}
          error={errors.contacto?.message}
        />
        <AuthSubmitButton loading={isSubmitting} loadingLabel="Enviando...">Continuar</AuthSubmitButton>
      </form>

      {sent && !devInfo && (
        <p className="text-center text-sm text-gray-500 animate-fade-up">Te enviaremos un código de acceso.</p>
      )}

      {devInfo?.devToken && (
        <div className="animate-fade-up rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <p className="font-semibold">Modo desarrollo — token:</p>
          <p className="mt-1 break-all font-mono">{devInfo.devToken}</p>
          {devInfo.verifyUrl && (
            <Link
              to={`/auth/verify?token=${devInfo.devToken}`}
              className="mt-2 inline-block rounded-lg bg-amber-500 px-3 py-1.5 font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              Usar este token →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClienteLoginForm({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [mode, setMode] = useState<SubMode>("password");

  return (
    <div className="space-y-4">
      <div key={mode} className="animate-fade-up">
        {mode === "password" ? <PasswordSubForm toast={toast} /> : <MagicSubForm toast={toast} />}
      </div>

      <button
        type="button"
        onClick={() => setMode((m) => (m === "password" ? "magic" : "password"))}
        className="w-full text-center text-xs font-medium text-welve-500 hover:underline"
      >
        {mode === "password" ? "Prefiero un enlace mágico" : "Prefiero usar mi contraseña"}
      </button>

      <p className="text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="text-welve-500 font-semibold hover:underline">Regístrate</Link>
      </p>
    </div>
  );
}
