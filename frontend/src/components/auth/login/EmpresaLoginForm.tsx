import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../../api/auth";
import { useAuth } from "../../../context/AuthContext";
import { Input } from "../../ui";
import AuthSubmitButton from "../AuthSubmitButton";
import type { useToast } from "../../../hooks/useToast";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
type Form = z.infer<typeof schema>;

function extraerError(e: unknown, fallback: string): string {
  return (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback;
}

export default function EmpresaLoginForm({ redirect, toast }: { redirect: string | null; toast: ReturnType<typeof useToast> }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setServerError("");
    try {
      const res = await authApi.loginEmpresa(data.email, data.password);
      login(res.data.accessToken);
      toast.success("¡Bienvenido de vuelta!");
      setTimeout(() => navigate(redirect || "/admin/dashboard"), 400);
    } catch (e: unknown) {
      setServerError(extraerError(e, "Email o contraseña incorrectos"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input {...register("email")} type="email" label="Email" placeholder="admin@empresa.pe" error={errors.email?.message} />
      <Input {...register("password")} variant="password" label="Contraseña" error={errors.password?.message} />
      <div className="text-right -mt-2">
        <button
          type="button"
          onClick={() => toast.info("Muy pronto podrás recuperar tu contraseña aquí")}
          className="text-xs font-medium text-welve-500 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
      {serverError && <p className="text-sm text-red-500 animate-fade-up">{serverError}</p>}
      <AuthSubmitButton loading={isSubmitting} loadingLabel="Iniciando sesión...">Iniciar sesión</AuthSubmitButton>
      <p className="text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="text-welve-500 font-semibold hover:underline">Registra tu negocio</Link>
      </p>
    </form>
  );
}
