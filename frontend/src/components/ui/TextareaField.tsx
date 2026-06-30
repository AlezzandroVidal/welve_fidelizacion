import { forwardRef, TextareaHTMLAttributes } from "react";

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?:  string;
  wrapperClassName?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField(
    { label, error, hint, wrapperClassName = "", className = "", disabled, rows = 3, ...rest },
    ref,
  ) {
    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <span className="text-xs font-semibold text-gray-600">{label}</span>
        )}

        <textarea
          ref={ref}
          rows={rows}
          disabled={disabled}
          className={[
            "w-full rounded-input border bg-white text-sm text-gray-900 leading-relaxed",
            "py-2.5 px-4 resize-y outline-none transition-colors duration-150",
            "focus:ring-2",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
              : "border-[#E2DEFF] focus:border-welve-500 focus:ring-welve-500/15",
            disabled ? "cursor-not-allowed bg-gray-50 opacity-50" : "",
            className,
          ].join(" ")}
          {...rest}
        />

        {error && <p className="text-xs text-red-500 animate-fade-up">{error}</p>}
        {hint && !error && <p className="text-[10px] text-gray-400">{hint}</p>}
      </div>
    );
  },
);
