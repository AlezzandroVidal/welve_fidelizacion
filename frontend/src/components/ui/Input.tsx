import {
  forwardRef, InputHTMLAttributes, ReactNode, useState, useId,
} from "react";
import { Eye, EyeOff, Search } from "lucide-react";

export type InputVariant = "default" | "search" | "password";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  placeholder?: string;
  label?:   string;
  error?:   string;
  hint?:    string;
  icon?:    ReactNode;
  variant?: InputVariant;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, error, hint, icon, variant = "default", className = "", id: idProp,
      type: typeProp, placeholder, ...rest },
    ref,
  ) {
    const [showPw, setShowPw] = useState(false);
    const uid = useId();
    const id  = idProp ?? uid;

    const hasLabel = !!label;
    const hasIcon  = variant === "search" || !!icon;

    const inputType =
      variant === "password" ? (showPw ? "text" : "password")
      : variant === "search" ? "search"
      : typeProp ?? "text";

    return (
      <div className={`relative ${className} group`}>
        {/* Icon left */}
        {hasIcon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-welve-500 transition-colors z-10">
            {variant === "search" ? <Search size={18} /> : icon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          type={inputType}
          placeholder={hasLabel ? " " : placeholder}
          className={[
            "peer block w-full bg-white/70 backdrop-blur-sm text-sm text-gray-900",
            "border shadow-sm shadow-gray-100/50",
            "transition-all duration-200 ease-out",
            "hover:bg-white hover:border-gray-300",
            "focus:bg-white focus:outline-none focus:ring-[3px]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            "rounded-xl",
            "px-4",
            hasLabel ? "pb-2 pt-6" : "py-4",
            hasIcon ? "pl-11" : "",
            variant === "password" ? "pr-11" : "",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-200 focus:border-welve-500 focus:ring-welve-500/20",
          ].join(" ")}
          {...rest}
        />

        {/* Floating label */}
        {hasLabel && (
          <label
            htmlFor={id}
            className={[
              "pointer-events-none absolute transition-all duration-200 ease-out z-10",
              hasIcon ? "left-11" : "left-4",
              "top-4 text-sm text-gray-400",
              "peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-welve-600",
              "peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]",
              "peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-gray-500",
            ].join(" ")}
          >
            {label}
          </label>
        )}

        {/* Password toggle */}
        {variant === "password" && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors z-10"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}

        {/* Error / hint */}
        {error && <p className="mt-1.5 text-xs font-medium text-red-500 animate-fade-up ml-1">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-gray-400 ml-1">{hint}</p>}
      </div>
    );
  }
);
