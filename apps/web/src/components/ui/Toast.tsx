"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** App-wide toast provider. Toasts slide in bottom-right and auto-dismiss after 3s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 3000);
    },
    [remove],
  );

  const value: ToastContextValue = {
    toast,
    success: (m) => toast(m, "success"),
    error: (m) => toast(m, "error"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const ICONS = {
  success: <CheckCircle2 size={18} className="text-success" />,
  error: <XCircle size={18} className="text-error" />,
  info: <Info size={18} className="text-accent-blue" />,
};

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <div
      role="status"
      className={cn(
        "animate-toast-in flex items-center gap-3 rounded-lg border border-border",
        "bg-bg-tertiary px-4 py-3 text-sm text-text-primary shadow-lg min-w-[240px] max-w-sm",
      )}
    >
      {ICONS[toast.type]}
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-text-muted hover:text-text-primary transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/** Access the toast API from any client component. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
