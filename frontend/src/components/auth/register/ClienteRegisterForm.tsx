import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../../api/auth";
import { useAuth } from "../../../context/AuthContext";
import { Input, SelectField, DateField } from "../../ui";
import { PERU_PHONE_REGEX } from "../../../utils/peru";
import AuthSubmitButton from "../AuthSubmitButton";
import type { useToast } from "../../../hooks/useToast";

const GENEROS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
  { value: "otro", label: "Otro" },
  { value: "prefiero_no_decir", label: "Prefiero no decir" },
];

const schema = z
  .object({
    nombre: z.string().min(2, "Mínimo 2 caracteres"),
    apellido: z.string().min(2, "Mínimo 2 caracteres"),
    porWhatsapp: z.boolean(),
    contacto: z.string().min(3, "Este campo es obligatorio"),
    fecha_nacimiento: z.string().optional(),
    genero: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.porWhatsapp) {
      if (!PERU_PHONE_REGEX.test(d.contacto)) {
        ctx.addIssue({ code: "custom", message: "Celular peruano inválido (+51XXXXXXXXX o 9XXXXXXXX)", path: ["contacto"] });
      }
    } else if (!/^\S+@\S+\.\S+$/.test(d.contacto)) {
      ctx.addIssue({ code: "custom", message: "Email inválido", path: ["contacto"] });
    }
  });

type Form = z.infer<typeof schema>;

export default function ClienteRegisterForm({ toast }: { toast: ReturnType<typeof useToast> }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [porWhatsapp, setPorWhatsapp] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { porWhatsapp: false },
  });

  const togglePorWhatsapp = (v: boolean) => {
    setPorWhatsapp(v);
    setValue("porWhatsapp", v, { shouldValidate: true });
  };

  const onSubmit = async (data: Form) => {
    setServerError("");
    try {
      const res = await authApi.registerCliente({
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.porWhatsapp ? undefined : data.contacto,
        whatsapp: data.porWhatsapp ? data.contacto : undefined,
        fecha_nacimiento: data.fecha_nacimiento || undefined,
        genero: data.genero || undefined,
      });
      login(res.data.accessToken);
      toast.success(`¡Bienvenido a Welve, ${data.nombre}!`);
      setTimeout(() => navigate("/wallet"), 500);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setServerError(msg ?? "Error al registrar el cliente");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-up">
      <div className="grid grid-cols-2 gap-3">
        <Input {...register("nombre")} label="Nombre" placeholder="Juan" error={errors.nombre?.message} />
        <Input {...register("apellido")} label="Apellido" placeholder="Pérez" error={errors.apellido?.message} />
      </div>

      <div>
        <div className="mb-1.5 flex justify-center gap-1 rounded-lg bg-welve-50 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => togglePorWhatsapp(false)}
            className={`flex-1 rounded-md py-1.5 transition-colors ${!porWhatsapp ? "bg-white text-welve-700 shadow-sm" : "text-gray-500"}`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => togglePorWhatsapp(true)}
            className={`flex-1 rounded-md py-1.5 transition-colors ${porWhatsapp ? "bg-white text-welve-700 shadow-sm" : "text-gray-500"}`}
          >
            WhatsApp
          </button>
        </div>
        <Input
          {...register("contacto")}
          type={porWhatsapp ? "tel" : "email"}
          label={porWhatsapp ? "WhatsApp" : "Email"}
          placeholder={porWhatsapp ? "+51 999 000 000" : "juan@email.com"}
          error={errors.contacto?.message}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DateField {...register("fecha_nacimiento")} label="Fecha de nacimiento" />
        <SelectField {...register("genero")} label="Género">
          <option value="">Prefiero no decir</option>
          {GENEROS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </SelectField>
      </div>

      {serverError && <p className="text-sm text-red-500 animate-fade-up">{serverError}</p>}
      <AuthSubmitButton loading={isSubmitting} loadingLabel="Creando cuenta...">Crear mi cuenta</AuthSubmitButton>
    </form>
  );
}
