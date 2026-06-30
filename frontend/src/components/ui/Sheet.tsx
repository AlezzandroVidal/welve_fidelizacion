import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface SheetProps {
  open:       boolean;
  onClose:    () => void;
  title?:     string;
  subtitle?:  string;
  children:   ReactNode;
  footer?:    ReactNode;
  width?:     number;
}

export function Sheet({ open, onClose, title, subtitle, children, footer, width = 420 }: SheetProps) {
  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        className={[
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]",
          "transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-2xl"
        style={{
          width:              `min(${width}px, 100vw)`,
          transform:          open ? "translateX(0)" : "translateX(100%)",
          transition:         "transform 280ms var(--ease-drawer)",
        }}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-gray-100 px-5 py-4 gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-bold text-gray-900 truncate">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-400 truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors active:scale-95"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-gray-100 p-4">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
