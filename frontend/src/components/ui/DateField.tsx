import { forwardRef, InputHTMLAttributes, useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface DateFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?:  string;
  wrapperClassName?: string;
}

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  function DateField(
    { label, error, hint, wrapperClassName = "", className = "", disabled, onChange, onBlur, name, ...rest },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenInputRef = useRef<HTMLInputElement | null>(null);
    
    // YYYY-MM-DD
    const [internalValue, setInternalValue] = useState<string>("");
    const [viewDate, setViewDate] = useState(() => new Date());

    const setRefs = (node: HTMLInputElement) => {
      if (node && !hiddenInputRef.current) {
        hiddenInputRef.current = node;
        setInternalValue(node.value);
        if (node.value) setViewDate(new Date(node.value + "T12:00:00"));
        
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        Object.defineProperty(node, "value", {
          set: (v) => {
            setInternalValue(v);
            if (v) setViewDate(new Date(v + "T12:00:00"));
            nativeSetter?.call(node, v);
          },
          get: () => {
            const nativeGetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.get;
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

    const pickDate = (day: number) => {
      const formattedMonth = String(viewDate.getMonth() + 1).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      const val = `${viewDate.getFullYear()}-${formattedMonth}-${formattedDay}`;
      
      setInternalValue(val);
      setOpen(false);
      
      if (hiddenInputRef.current) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        nativeSetter?.call(hiddenInputRef.current, val);
        hiddenInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };
    
    const changeMonth = (diff: number) => {
      setViewDate(prev => {
        const nd = new Date(prev);
        nd.setMonth(nd.getMonth() + diff);
        return nd;
      });
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
    
    const displayValue = internalValue 
      ? new Date(internalValue + "T12:00:00").toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : "";

    const isFilled = !!internalValue;

    return (
      <div className={`relative ${wrapperClassName} group`} ref={containerRef}>
        <div className="relative">
          <input 
            type="date"
            ref={setRefs} 
            name={name} 
            onChange={(e) => {
               setInternalValue(e.target.value);
               onChange?.(e);
            }} 
            onBlur={onBlur} 
            className="hidden" 
            {...rest}
          />
          
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
              {displayValue || "Seleccionar..."}
            </span>
            <div className={`pointer-events-none text-gray-400 group-focus-within:text-welve-500 transition-all duration-200 bg-white/50 rounded-full p-0.5 ${open ? "text-welve-500" : ""}`}>
              <CalendarDays size={18} />
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
            <div className="absolute left-0 top-full z-50 mt-2 w-[220px] rounded-xl border border-gray-100 bg-white p-2.5 shadow-xl shadow-gray-200/40 animate-scale-in origin-top">
              <div className="flex items-center justify-between mb-2.5">
                <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <div className="font-semibold text-xs text-gray-800">
                  {MONTHS[month]} {year}
                </div>
                <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 mb-1.5">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                {days.map(d => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const isSelected = internalValue === dateStr;
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => pickDate(d)}
                      className={[
                        "h-6 w-6 mx-auto rounded-[6px] text-[10px] flex items-center justify-center transition-colors",
                        isSelected 
                          ? "bg-welve-500 text-white font-semibold shadow-sm shadow-welve-500/30" 
                          : isToday
                          ? "bg-gray-100 text-welve-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      ].join(" ")}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-xs font-medium text-red-500 animate-fade-up ml-1">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400 ml-1">{hint}</p>}
      </div>
    );
  }
);
