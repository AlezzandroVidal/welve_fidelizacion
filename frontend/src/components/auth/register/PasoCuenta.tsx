import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "../../ui";
import PasswordStrengthBar from "../PasswordStrengthBar";
import type { EmpresaForm } from "./EmpresaRegisterWizard";

interface Props {
  register: UseFormRegister<EmpresaForm>;
  errors: FieldErrors<EmpresaForm>;
  password: string;
}

export default function PasoCuenta({ register, errors, password }: Props) {
  return (
    <div className="space-y-4 animate-fade-up">
      <Input {...register("admin_nombre")} label="Nombre completo del administrador" placeholder="Juan Pérez" error={errors.admin_nombre?.message} />
      <Input {...register("admin_email")} type="email" label="Email" placeholder="admin@miempresa.pe" error={errors.admin_email?.message} />
      <Input {...register("admin_telefono")} type="tel" label="Teléfono (opcional)" placeholder="+51 999 000 000" error={errors.admin_telefono?.message} />
      <div>
        <Input {...register("admin_password")} variant="password" label="Contraseña" placeholder="Mínimo 8 caracteres" error={errors.admin_password?.message} />
        <div className="mt-2"><PasswordStrengthBar password={password} /></div>
      </div>
      <Input {...register("confirmar_password")} variant="password" label="Confirmar contraseña" error={errors.confirmar_password?.message} />
    </div>
  );
}
