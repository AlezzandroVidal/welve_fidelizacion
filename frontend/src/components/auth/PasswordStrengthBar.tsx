export type PasswordStrength = 0 | 1 | 2 | 3;

export function calcularFortaleza(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return 1; // débil
  if (score <= 2) return 2; // media
  return 3; // fuerte
}

const CONFIG: Record<PasswordStrength, { label: string; color: string; width: string }> = {
  0: { label: "", color: "bg-transparent", width: "0%" },
  1: { label: "Débil", color: "bg-red-500", width: "33%" },
  2: { label: "Media", color: "bg-amber-500", width: "66%" },
  3: { label: "Fuerte", color: "bg-emerald-500", width: "100%" },
};

export default function PasswordStrengthBar({ password }: { password: string }) {
  const strength = calcularFortaleza(password);
  if (!password) return null;
  const { label, color, width } = CONFIG[strength];

  return (
    <div className="animate-fade-up">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all duration-300 ease-out ${color}`} style={{ width }} />
      </div>
      <p
        className={[
          "mt-1 text-xs font-medium",
          strength === 1 ? "text-red-500" : strength === 2 ? "text-amber-500" : "text-emerald-600",
        ].join(" ")}
      >
        Seguridad: {label}
      </p>
    </div>
  );
}
