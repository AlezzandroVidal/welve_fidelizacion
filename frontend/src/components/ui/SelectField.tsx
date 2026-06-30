import { forwardRef, ReactNode, SelectHTMLAttributes, useState, useRef, useEffect, Children, isValidElement } from "react";
import { ChevronDown, Check } from "lucide-react";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:    string;
  error?:    string;
  hint?:     string;
  children:  ReactNode;
  wrapperClassName?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    { label, error, hint, children, wrapperClassName = "", className = "", disabled, onChange, onBlur, name, ...rest },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);
    const [internalValue, setInternalValue] = useState<string>("");

    const setRefs = (node: HTMLSelectElement) => {
      if (node && !hiddenSelectRef.current) {
        hiddenSelectRef.current = node;
        setInternalValue(node.value);
        
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set;
        Object.defineProperty(node, "value", {
          set: (v) => {
            setInternalValue(v);
            nativeSetter?.call(node, v);
          },
          get: () => {
            const nativeGetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.get;
            return nativeGetter?.call(node);
          }
        });
      }
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as any).current = node;
    };

    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const options = Children.toArray(children).map(child => {
      if (isValidElement(child) && child.type === 'option') {
        return { 
          value: child.props.value, 
          label: child.props.children, 
          disabled: child.props.disabled 
        };
      }
      return null;
    }).filter(Boolean) as {value: string, label: ReactNode, disabled?: boolean}[];

    const selectedOption = options.find(o => String(o.value) === String(internalValue)) || options[0];

    const pick = (val: string) => {
      setInternalValue(val);
      setOpen(false);
      if (hiddenSelectRef.current) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set;
        nativeSetter?.call(hiddenSelectRef.current, val);
        hiddenSelectRef.current.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };

    const isFilled = selectedOption && selectedOption.value !== "";

    return (
      <div className={`relative ${wrapperClassName} group`} ref={containerRef}>
        <div className="relative">
          <select 
            ref={setRefs} 
            name={name} 
            onChange={(e) => {
               setInternalValue(e.target.value);
               onChange?.(e);
            }} 
            onBlur={onBlur} 
            className="hidden" 
            {...rest}
          >
            {children}
          </select>
          
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(!open)}
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
              className
            ].join(" ")}
          >
            <span className={isFilled ? "text-gray-900" : (label ? "text-transparent" : "text-gray-400")}>
              {selectedOption ? selectedOption.label : "Seleccionar..."}
            </span>
            <div className={`pointer-events-none text-gray-400 group-focus-within:text-welve-500 transition-all duration-200 bg-white/50 rounded-full p-0.5 ${open ? "rotate-180 text-welve-500" : ""}`}>
              <ChevronDown size={16} />
            </div>
          </button>
          
          {/* Floating label */}
          {label && (
            <label
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
          
          {open && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl shadow-gray-200/40 animate-scale-in origin-top">
              {options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => pick(opt.value)}
                  className={[
                    "flex w-full items-center justify-between px-4 py-2.5 text-sm text-left",
                    "transition-colors duration-100",
                    opt.disabled
                      ? "cursor-not-allowed text-gray-300"
                      : String(opt.value) === String(internalValue)
                      ? "bg-welve-500/10 text-welve-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {opt.label}
                  {String(opt.value) === String(internalValue) && <Check size={16} className="text-welve-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="mt-1.5 text-xs font-medium text-red-500 animate-fade-up ml-1">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400 ml-1">{hint}</p>}
      </div>
    );
  }
);
