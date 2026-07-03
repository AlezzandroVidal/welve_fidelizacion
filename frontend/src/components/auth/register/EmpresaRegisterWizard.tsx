import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../../api/auth";
import { useAuth } from "../../../context/AuthContext";
import { PERU_PHONE_REGEX } from "../../../utils/peru";
import { RUBROS } from "../rubros";
import Stepper from "../Stepper";
import AuthSubmitButton from "../AuthSubmitButton";
import PasoNegocio from "./PasoNegocio";
import PasoCuenta from "./PasoCuenta";
import PasoConfirmar from "./PasoConfirmar";
import type { useToast } from "../../../hooks/useToast";

const RUBRO_VALUES = RUBROS.map((r) => r.value) as [string, ...string[]];

const empresaSchema = z
  .object({
    nombre: z.string().min(2, "Mínimo 2 caracteres"),
    rubro: z.enum(RUBRO_VALUES, { message: "Selecciona un rubro" }),
    descripcion: z.string().optional(),
    direccion: z.string().optional(),
    admin_nombre: z.string().min(2, "Mínimo 2 caracteres"),
    admin_email: z.string().email("Email inválido"),
    admin_telefono: z
      .string()
      .optional()
      .refine((v) => !v || PERU_PHONE_REGEX.test(v), "Celular peruano inválido (+51XXXXXXXXX o 9XXXXXXXX)"),
    admin_password: z.string().min(8, "Mínimo 8 caracteres").regex(/\d/, "Debe incluir al menos un número"),
    confirmar_password: z.string(),
    aceptaTerminos: z.boolean().refine((v) => v === true, { message: "Debes aceptar los términos y condiciones" }),
  })
  .refine((d) => d.admin_password === d.confirmar_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar_password"],
  });

export type EmpresaForm = z.infer<typeof empresaSchema>;

const STEP_FIELDS: (keyof EmpresaForm)[][] = [
  ["nombre", "rubro"],
  ["admin_nombre", "admin_email", "admin_telefono", "admin_password", "confirmar_password"],
  ["aceptaTerminos"],
];
const STEP_LABELS = ["Negocio", "Cuenta", "Confirmar"];

export default function EmpresaRegisterWizard({ toast }: { toast: ReturnType<typeof useToast> }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState("");
  const [creating, setCreating] = useState(false);

  const { register, handleSubmit, trigger, setValue, watch, formState: { errors } } = useForm<EmpresaForm>({
    resolver: zodResolver(empresaSchema),
    defaultValues: { aceptaTerminos: false },
  });
  const values = watch();

  const siguiente = async () => {
    const ok = await trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => s + 1);
  };
  const anterior = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = async (data: EmpresaForm) => {
    setServerError("");
    setCreating(true);
    try {
      await authApi.registerEmpresa({
        nombre: data.nombre,
        rubro: data.rubro,
        admin_nombre: data.admin_nombre,
        admin_email: data.admin_email,
        admin_password: data.admin_password,
        admin_telefono: data.admin_telefono || undefined,
        direccion: data.direccion || undefined,
        descripcion: data.descripcion || undefined,
      });
      // El registro no devuelve token propio (solo el perfil creado) — logueamos
      // con las mismas credenciales para llevar al admin directo al dashboard.
      const res = await authApi.loginEmpresa(data.admin_email, data.admin_password);
      login(res.data.accessToken);
      toast.success(`¡Bienvenido a Welve, ${data.admin_nombre.split(" ")[0]}!`);
      setTimeout(() => navigate("/admin/dashboard"), 500);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setServerError(msg ?? "Error al registrar la empresa");
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Stepper steps={STEP_LABELS} current={step} />

      {step === 0 && (
        <PasoNegocio
          register={register}
          errors={errors}
          rubroActual={values.rubro}
          onRubroChange={(v) => setValue("rubro", v as EmpresaForm["rubro"], { shouldValidate: true })}
        />
      )}
      {step === 1 && <PasoCuenta register={register} errors={errors} password={values.admin_password || ""} />}
      {step === 2 && <PasoConfirmar values={values} register={register} errors={errors} />}

      {serverError && <p className="text-sm text-red-500 animate-fade-up">{serverError}</p>}

      <div className="flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={anterior}
            className="flex-1 rounded-xl border border-[#E2DEFF] py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-welve-50"
          >
            Anterior
          </button>
        )}
        {step < 2 ? (
          <button
            type="button"
            onClick={siguiente}
            className="flex-1 rounded-xl bg-welve-500 py-3 text-sm font-semibold text-white transition-all duration-150 ease-out hover:bg-welve-600 active:scale-[0.97]"
          >
            Siguiente
          </button>
        ) : (
          <AuthSubmitButton loading={creating} loadingLabel="Creando...">Crear mi cuenta</AuthSubmitButton>
        )}
      </div>
    </form>
  );
}
