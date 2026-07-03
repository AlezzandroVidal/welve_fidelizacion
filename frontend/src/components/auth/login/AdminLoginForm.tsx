import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
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

export default function AdminLoginForm({ toast }: { toast: ReturnType<typeof useToast> }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setServerError("");
    try {
      const res = await authApi.loginAdmin(data.email, data.password);
      login((res.data as { accessToken: string }).accessToken);
      toast.success("Bienvenido, equipo Welve");
      setTimeout(() => navigate("/superadmin"), 400);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setServerError(msg ?? "Email o contraseña incorrectos");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input {...register("email")} type="email" label="Email" placeholder="soporte@welve.pe" error={errors.email?.message} />
      <Input {...register("password")} variant="password" label="Contraseña" error={errors.password?.message} />
      {serverError && <p className="text-sm text-red-500 animate-fade-up">{serverError}</p>}
      <AuthSubmitButton loading={isSubmitting} loadingLabel="Iniciando sesión...">Ingresar</AuthSubmitButton>
    </form>
  );
}
