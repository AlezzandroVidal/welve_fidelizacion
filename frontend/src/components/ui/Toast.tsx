import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { ToastItem, ToastVariant } from "../../hooks/useToast";

const STYLES: Record<ToastVariant, { bg: string; text: string; icon: typeof CheckCircle2; bar: string }> = {
  success: { bg: "bg-[#3FD17A]", text: "text-white", icon: CheckCircle2, bar: "bg-white/30" },
  error:   { bg: "bg-red-500",   text: "text-white", icon: XCircle,       bar: "bg-white/30" },
  warning: { bg: "bg-amber-500", text: "text-white", icon: AlertTriangle,  bar: "bg-white/30" },
  info:    { bg: "bg-blue-500",  text: "text-white", icon: Info,           bar: "bg-white/30" },
};

function ToastCard({ item, onDismiss, autoDismissMs }: {
  item:          ToastItem;
  onDismiss:     (id: string) => void;
  autoDismissMs: number;
}) {
  const [visible, setVisible] = useState(true);
  const s   = STYLES[item.variant];
  const Icon = s.icon;

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), autoDismissMs - 300);
    return () => clearTimeout(t);
  }, [autoDismissMs]);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => onDismiss(item.id), 300);
      return () => clearTimeout(t);
    }
  }, [visible, item.id, onDismiss]);

  return (
    <div
      className={[
        "relative flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg overflow-hidden min-w-[240px] max-w-[340px]",
        "transition-all duration-300",
        s.bg, s.text,
        visible ? "animate-slide-up opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      ].join(" ")}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span className="text-sm font-medium flex-1">{item.msg}</span>
      <button
        onClick={() => setVisible(false)}
        className="flex-shrink-0 rounded p-0.5 hover:bg-white/20 transition-colors active:scale-95"
        aria-label="Cerrar"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-[2px] ${s.bar} rounded-full`}
        style={{
          animation: `progress-shrink ${autoDismissMs}ms linear forwards`,
          width: "100%",
        }}
      />
    </div>
  );
}

interface ToasterProps {
  toasts:        ToastItem[];
  onDismiss:     (id: string) => void;
  autoDismissMs?: number;
}

export function Toaster({ toasts, onDismiss, autoDismissMs = 4000 }: ToasterProps) {
  return (
    <>
      <style>{`
        @keyframes progress-shrink {
          from { transform: scaleX(1); transform-origin: left; }
          to   { transform: scaleX(0); transform-origin: left; }
        }
      `}</style>
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard item={t} onDismiss={onDismiss} autoDismissMs={autoDismissMs} />
          </div>
        ))}
      </div>
    </>
  );
}
