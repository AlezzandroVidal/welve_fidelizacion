import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { authApi } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

// ── Schemas ───────────────────────────────────────────────────────────────────

const empresaSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const clienteSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type EmpresaForm = z.infer<typeof empresaSchema>;
type ClienteForm = z.infer<typeof clienteSchema>;

// ── Sub-forms ─────────────────────────────────────────────────────────────────

function EmpresaLoginForm({ redirect }: { redirect: string | null }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmpresaForm>({
    resolver: zodResolver(empresaSchema),
  });

  const onSubmit = async (data: EmpresaForm) => {
    setServerError("");
    try {
      const res = await authApi.loginEmpresa(data.email, data.password);
      login(res.data.accessToken);
      navigate(redirect || "/admin/dashboard");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setServerError(msg ?? "Error al iniciar sesión");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Email" error={errors.email?.message}>
        <input {...register("email")} type="email" placeholder="admin@empresa.pe" className={input(!!errors.email)} />
      </Field>
      <Field label="Contraseña" error={errors.password?.message}>
        <input {...register("password")} type="password" placeholder="••••••••" className={input(!!errors.password)} />
      </Field>
      {serverError && <p className="text-sm text-red-500">{serverError}</p>}
      <SubmitBtn loading={isSubmitting}>Ingresar</SubmitBtn>
      <p className="text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="text-welve-500 font-medium hover:underline">Regístrate</Link>
      </p>
    </form>
  );
}

function ClienteLoginForm({ redirect }: { redirect: string | null }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
  });

  const onSubmit = async (data: ClienteForm) => {
    setServerError("");
    try {
      const res = await authApi.loginCliente(data.email, data.password);
      login(res.data.accessToken);
      navigate(redirect || "/wallet");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setServerError(msg ?? "Error al iniciar sesión");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-up">
      <Field label="Email" error={errors.email?.message}>
        <input {...register("email")} type="email" placeholder="tu@email.com" className={input(!!errors.email)} />
      </Field>
      <Field label="Contraseña" error={errors.password?.message}>
        <input {...register("password")} type="password" placeholder="••••••••" className={input(!!errors.password)} />
      </Field>
      {serverError && <p className="text-sm text-red-500">{serverError}</p>}
      <SubmitBtn loading={isSubmitting}>Ingresar a la Wallet</SubmitBtn>
      <p className="text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="text-welve-500 font-medium hover:underline">Regístrate</Link>
      </p>
    </form>
  );
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SubmitBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white
        transition-all duration-150 ease-out
        hover:bg-welve-600
        active:scale-[0.97]
        disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : children}
    </button>
  );
}

const input = (hasError: boolean) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition
   focus:ring-2 focus:ring-welve-500/30 focus:border-welve-500
   ${hasError ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`;

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "empresa" | "cliente";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [tab, setTab] = useState<Tab>(redirect?.startsWith("/wallet") ? "cliente" : "empresa");

  return (
    <div className="min-h-screen bg-welve-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-welve-500 shadow-lg mb-3">
            <span className="text-2xl font-black text-white">W</span>
          </div>
          <h1 className="text-2xl font-bold text-welve-800">Welve</h1>
          <p className="text-sm text-gray-500 mt-1">Plataforma de fidelización</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-card">
          {/* Tabs con sliding indicator via clip-path */}
          <div className="relative mb-6 rounded-xl bg-welve-50 p-1">
            {/* Base labels */}
            <div className="relative grid grid-cols-2 gap-1">
              {(["empresa", "cliente"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="relative z-10 rounded-lg py-2 text-sm font-medium text-gray-500 transition-colors duration-200"
                >
                  {t === "empresa" ? "Empresa" : "Cliente"}
                </button>
              ))}
            </div>

            {/* Sliding pill */}
            <div
              className="pointer-events-none absolute inset-1 grid grid-cols-2 gap-1 transition-none"
              aria-hidden
            >
              <div
                className="rounded-lg bg-welve-500 shadow-sm transition-transform duration-200 ease-out"
                style={{ transform: tab === "cliente" ? "translateX(calc(100% + 4px))" : "translateX(0)" }}
              />
            </div>

            {/* Active labels (clipped to pill) */}
            <div
              className="pointer-events-none absolute inset-1 grid grid-cols-2 gap-1 overflow-hidden"
              style={{
                clipPath: tab === "empresa"
                  ? "inset(0 50% 0 0 round 8px)"
                  : "inset(0 0 0 50% round 8px)",
                transition: "clip-path 200ms cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              {(["empresa", "cliente"] as Tab[]).map((t) => (
                <span key={t} className="flex items-center justify-center rounded-lg py-2 text-sm font-medium text-white">
                  {t === "empresa" ? "Empresa" : "Cliente"}
                </span>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="animate-fade-up" key={tab}>
            {tab === "empresa" ? <EmpresaLoginForm redirect={redirect} /> : <ClienteLoginForm redirect={redirect} />}
          </div>
        </div>
      </div>
    </div>
  );
}
