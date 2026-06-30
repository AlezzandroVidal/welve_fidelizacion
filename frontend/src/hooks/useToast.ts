import { useState, useCallback } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id:      string;
  msg:     string;
  variant: ToastVariant;
}

export function useToast(autoDismissMs = 4000) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((msg: string, variant: ToastVariant = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => t.length >= 3 ? [...t.slice(1), { id, msg, variant }] : [...t, { id, msg, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), autoDismissMs);
    return id;
  }, [autoDismissMs]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return {
    toasts,
    dismiss,
    success: (msg: string) => push(msg, "success"),
    error:   (msg: string) => push(msg, "error"),
    warning: (msg: string) => push(msg, "warning"),
    info:    (msg: string) => push(msg, "info"),
  };
}
