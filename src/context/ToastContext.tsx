"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Info, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "loading" | "info";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  description?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, description?: string, duration?: number) => number;
  dismiss: (id: number) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextType | null>(null);

let _id = 0;

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((
    message: string,
    type: ToastType = "info",
    description?: string,
    duration = 4500
  ): number => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type, description }]);
    if (type !== "loading") {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Global Toast Renderer */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-[360px]">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.92, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, scale: 0.95, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className={`relative flex items-start gap-3.5 px-5 py-4 rounded-2xl border backdrop-blur-2xl shadow-2xl pointer-events-auto overflow-hidden
                ${t.type === "success" ? "bg-emerald-950/70 border-emerald-500/25 shadow-emerald-900/20" :
                  t.type === "error"   ? "bg-red-950/70 border-red-500/25 shadow-red-900/20" :
                  t.type === "loading" ? "bg-zinc-900/90 border-violet-500/20 shadow-violet-900/20" :
                                         "bg-zinc-900/90 border-white/10 shadow-black/30"}`}
            >
              {/* Glow accent line */}
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full
                ${t.type === "success" ? "bg-emerald-400" :
                  t.type === "error"   ? "bg-red-400" :
                  t.type === "loading" ? "bg-violet-400" : "bg-blue-400"}`} />

              {/* Icon */}
              <span className="shrink-0 mt-0.5">
                {t.type === "success" && <CheckCircle2 size={17} className="text-emerald-400" />}
                {t.type === "error"   && <XCircle size={17} className="text-red-400" />}
                {t.type === "loading" && <Loader2 size={17} className="text-violet-400 animate-spin" />}
                {t.type === "info"    && <Info size={17} className="text-blue-400" />}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-snug
                  ${t.type === "success" ? "text-emerald-100" :
                    t.type === "error"   ? "text-red-100" :
                    t.type === "loading" ? "text-zinc-100" : "text-zinc-100"}`}>
                  {t.message}
                </p>
                {t.description && (
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{t.description}</p>
                )}
              </div>

              {/* Dismiss */}
              {t.type !== "loading" && (
                <button
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 mt-0.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
