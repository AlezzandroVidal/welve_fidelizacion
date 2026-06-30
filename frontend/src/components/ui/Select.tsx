import { useEffect, useRef, useState, useId } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value:    string;
  label:    string;
  disabled?: boolean;
}

interface SelectProps {
  options:      SelectOption[];
  value?:       string;
  onChange?:    (value: string) => void;
  label?:       string;
  placeholder?: string;
  error?:       string;
  disabled?:    boolean;
  className?:   string;
}

export function Select({
  options, value, onChange, label, placeholder = "Seleccionar...",
  error, disabled = false, className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);
  const uid  = useId();

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function pick(opt: SelectOption) {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setOpen(false);
  }
  
  const isFilled = selected && selected.value !== "";

  return (
    <div ref={ref} className={`relative ${className} group`}>
      <button
        id={uid}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex w-full items-center justify-between rounded-xl px-4",
          label ? "pb-2 pt-6" : "py-4",
          "bg-white/70 backdrop-blur-sm text-sm text-left border shadow-sm shadow-gray-100/50",
          "transition-all duration-200 ease-out",
          "hover:bg-white hover:border-gray-300",
          "focus:outline-none focus:bg-white focus:ring-[3px]",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
            : open
            ? "border-welve-500 ring-[3px] ring-welve-500/20 bg-white"
            : "border-gray-200 focus:border-welve-500 focus:ring-welve-500/20",
        ].join(" ")}
      >
        <span className={isFilled ? "text-gray-900" : (label ? "text-transparent" : "text-gray-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <div className={`pointer-events-none text-gray-400 group-focus-within:text-welve-500 transition-all duration-200 bg-white/50 rounded-full p-0.5 ${open ? "rotate-180 text-welve-500" : ""}`}>
          <ChevronDown size={16} />
        </div>
      </button>
      
      {/* Floating label */}
      {label && (
        <label
          htmlFor={uid}
          className={[
            "pointer-events-none absolute left-4 transition-all duration-200 ease-out z-10",
            isFilled || open
              ? "top-1.5 text-[10px] font-semibold text-gray-500 group-focus-within:text-welve-600"
              : "top-4 text-sm text-gray-400",
          ].join(" ")}
        >
          {label}
        </label>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl shadow-gray-200/40 animate-scale-in origin-top">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={opt.disabled}
              onClick={() => pick(opt)}
              className={[
                "flex w-full items-center justify-between px-4 py-2.5 text-sm text-left",
                "transition-colors duration-100",
                opt.disabled
                  ? "cursor-not-allowed text-gray-300"
                  : opt.value === value
                  ? "bg-welve-500/10 text-welve-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              {opt.label}
              {opt.value === value && (
                <Check size={16} className="text-welve-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500 animate-fade-up ml-1">{error}</p>
      )}
    </div>
  );
}
