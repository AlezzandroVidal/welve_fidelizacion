import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:   "bg-welve-500 text-white hover:bg-welve-600 focus-visible:ring-welve-500/40 shadow-sm",
  secondary: "border border-welve-500 text-welve-600 bg-transparent hover:bg-welve-500/8 focus-visible:ring-welve-500/40",
  ghost:     "text-gray-600 bg-transparent hover:bg-welve-500/10 focus-visible:ring-welve-500/20",
  danger:    "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 focus-visible:ring-red-500/30",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-[8px]",
  md: "px-4 py-2.5 text-sm gap-2   rounded-[10px]",
  lg: "px-5 py-3   text-base gap-2.5 rounded-[10px]",
};

export function Button({
  variant = "primary",
  size    = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-semibold",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2",
        "active:scale-[0.97]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={size === "lg" ? 18 : 16} className="animate-spin" />
          <span>Cargando...</span>
        </>
      ) : children}
    </button>
  );
}
