import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../../api/auth";
import { Input, SelectField } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const RUBROS = [
  { value: "food_beverage", label: "Comida y bebida"     },
  { value: "belleza",       label: "Belleza y cuidado"   },
  { value: "retail",        label: "Retail / tienda"     },
  { value: "otro",          label: "Otro"                },
];

const empresaSchema = z.object({
  nombre:             z.string().min(2, "Mínimo 2 caracteres"),
  rubro:              z.enum(["food_beverage", "belleza", "retail", "otro"]),
  admin_email:        z.string().email("Email inválido"),
  admin_password:     z.string().min(8, "Mínimo 8 caracteres"),
  confirmar_password: z.string(),
}).refine((d) => d.admin_password === d.confirmar_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirmar_password"],
});

const clienteSchema = z.object({
  nombre:             z.string().min(2, "Mínimo 2 caracteres"),
  email:              z.string().email("Email inválido"),
  whatsapp:           z.string().optional(),
  password:           z.string().min(6, "Mínimo 6 caracteres"),
  confirmar_password: z.string(),
}).refine((d) => d.password === d.confirmar_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirmar_password"],
});

type EmpresaForm = z.infer<typeof empresaSchema>;
type ClienteForm = z.infer<typeof clienteSchema>;
type Tab = "empresa" | "cliente";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState<Tab>("empresa");
  const [serverError, setServerError] = useState("");

  const { register: regEmp, handleSubmit: handEmp, formState: { errors: errEmp, isSubmitting: subEmp } } = useForm<EmpresaForm>({
    resolver: zodResolver(empresaSchema),
  });

  const { register: regCli, handleSubmit: handCli, formState: { errors: errCli, isSubmitting: subCli } } = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
  });

  const onSubmitEmpresa = async (data: EmpresaForm) => {
    setServerError("");
    try {
      await authApi.registerEmpresa({
        nombre:         data.nombre,
        rubro:          data.rubro,
        admin_email:    data.admin_email,
        admin_password: data.admin_password,
      });
      navigate("/login");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setServerError(msg ?? "Error al registrar la empresa");
    }
  };

  const onSubmitCliente = async (data: ClienteForm) => {
    setServerError("");
    try {
      const res = await authApi.registerCliente({
        nombre:   data.nombre,
        email:    data.email,
        password: data.password,
        whatsapp: data.whatsapp,
      });
      login(res.data.accessToken);
      navigate("/wallet");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setServerError(msg ?? "Error al registrar el cliente");
    }
  };

  return (
    <div className="min-h-screen bg-welve-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-welve-500 shadow-lg mb-3">
            <span className="text-2xl font-black text-white">W</span>
          </div>
          <h1 className="text-2xl font-bold text-welve-800">Crear cuenta</h1>
          <p className="text-sm text-gray-500 mt-1">Únete a Welve</p>
        </div>

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

          <div className="animate-fade-up" key={tab}>
            {tab === "empresa" ? (
              <form onSubmit={handEmp(onSubmitEmpresa)} className="space-y-4">
                <Input {...regEmp("nombre")} label="Nombre de la empresa" placeholder="Café Ritual" error={errEmp.nombre?.message} />
                <SelectField {...regEmp("rubro")} label="Rubro" error={errEmp.rubro?.message}>
                  <option value="">Selecciona un rubro</option>
                  {RUBROS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </SelectField>
                <Input {...regEmp("admin_email")} type="email" label="Email del administrador" placeholder="admin@miempresa.pe" error={errEmp.admin_email?.message} />
                <Input {...regEmp("admin_password")} variant="password" label="Contraseña" placeholder="Mínimo 8 caracteres" error={errEmp.admin_password?.message} />
                <Input {...regEmp("confirmar_password")} variant="password" label="Confirmar contraseña" placeholder="Repite la contraseña" error={errEmp.confirmar_password?.message} />
                {serverError && <p className="text-sm text-red-500 animate-fade-up">{serverError}</p>}
                <button type="submit" disabled={subEmp} className="w-full rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-welve-600 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed">
                  {subEmp ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Crear empresa"}
                </button>
                <p className="text-center text-sm text-gray-500">¿Ya tienes cuenta? <Link to="/login" className="text-welve-500 font-medium hover:underline">Ingresar</Link></p>
              </form>
            ) : (
              <form onSubmit={handCli(onSubmitCliente)} className="space-y-4">
                <Input {...regCli("nombre")} label="Tu Nombre" placeholder="Juan Pérez" error={errCli.nombre?.message} />
                <Input {...regCli("email")} type="email" label="Email" placeholder="juan@email.com" error={errCli.email?.message} />
                <Input {...regCli("whatsapp")} type="tel" label="WhatsApp (Opcional)" placeholder="+51 999 000 000" error={errCli.whatsapp?.message} />
                <Input {...regCli("password")} variant="password" label="Contraseña" placeholder="Mínimo 6 caracteres" error={errCli.password?.message} />
                <Input {...regCli("confirmar_password")} variant="password" label="Confirmar contraseña" placeholder="Repite la contraseña" error={errCli.confirmar_password?.message} />
                {serverError && <p className="text-sm text-red-500 animate-fade-up">{serverError}</p>}
                <button type="submit" disabled={subCli} className="w-full rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-welve-600 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed">
                  {subCli ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Crear cuenta"}
                </button>
                <p className="text-center text-sm text-gray-500">¿Ya tienes cuenta? <Link to="/login" className="text-welve-500 font-medium hover:underline">Ingresar</Link></p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
