import { forwardRef, InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?:       string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, description, className = "", ...rest }, ref) {
    return (
      <label className={`flex items-start gap-3 cursor-pointer select-none group ${className}`}>
        {/* Hidden native input + custom visual */}
        <div className="relative mt-0.5 h-[18px] w-[18px] flex-shrink-0">
          <input
            ref={ref}
            type="checkbox"
            className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 z-[1]"
            {...rest}
          />
          {/* Box */}
          <div
            className="absolute inset-0 rounded-[5px] border-2 border-gray-200 bg-white
              transition-all duration-150
              peer-checked:border-welve-500 peer-checked:bg-welve-500
              peer-focus-visible:ring-2 peer-focus-visible:ring-welve-500/20
              group-hover:border-welve-300"
          />
          {/* Checkmark */}
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute inset-0 w-full h-full
              opacity-0 scale-75 transition-all duration-150
              peer-checked:opacity-100 peer-checked:scale-100"
          >
            <path d="M3 8.5L6.5 12L13 5" />
          </svg>
        </div>

        {(label || description) && (
          <div>
            {label && (
              <p className="text-sm font-medium text-gray-700 leading-tight">{label}</p>
            )}
            {description && (
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            )}
          </div>
        )}
      </label>
    );
  },
);
