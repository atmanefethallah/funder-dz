// src/components/ui/Toast.tsx — نظام تنبيهات (Toast) بديل احترافي عن alert/confirm الأصلية
// صفر تبعيات خارجية — مبني بـ React Context فقط
"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
};

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ToastContextValue = {
  toast: (opts: { type?: ToastType; title: string; message?: string; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ type = "info", title, message, duration = 4500 }: { type?: ToastType; title: string; message?: string; duration?: number }) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const success = useCallback((title: string, message?: string) => toast({ type: "success", title, message }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ type: "error", title, message, duration: 6000 }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: "warning", title, message }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ type: "info", title, message }), [toast]);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ opts, resolve });
    });
  }, []);

  const handleConfirm = (val: boolean) => {
    confirmState?.resolve(val);
    setConfirmState(null);
  };

  // تنظيف المؤقتات عند الإزالة
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, confirm }}>
      {children}

      {/* حاوية التنبيهات — أعلى الشاشة (مناسب للعربية RTL) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-2 w-[92vw] max-w-md pointer-events-none" dir="rtl" aria-live="polite">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>

      {/* نافذة التأكيد — بديل confirm() */}
      {confirmState && (
        <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" dir="rtl" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95">
            <h3 className="text-lg font-black text-gray-900 mb-2">{confirmState.opts.title}</h3>
            {confirmState.opts.message && (
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">{confirmState.opts.message}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleConfirm(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                {confirmState.opts.cancelText || "إلغاء"}
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white transition ${
                  confirmState.opts.danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                }`}
                autoFocus
              >
                {confirmState.opts.confirmText || "تأكيد"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const config = {
    success: { icon: CheckCircle2, classes: "bg-green-600", iconColor: "text-green-100" },
    error: { icon: XCircle, classes: "bg-red-600", iconColor: "text-red-100" },
    warning: { icon: AlertTriangle, classes: "bg-amber-500", iconColor: "text-amber-100" },
    info: { icon: Info, classes: "bg-blue-600", iconColor: "text-blue-100" },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      className={`${config.classes} text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 pointer-events-auto animate-in slide-in-from-top-4 fade-in`}
      role="alert"
    >
      <Icon size={22} className={`${config.iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm leading-snug">{toast.title}</p>
        {toast.message && <p className="text-xs mt-1 opacity-90 leading-relaxed">{toast.message}</p>}
      </div>
      <button onClick={onDismiss} className="shrink-0 opacity-70 hover:opacity-100 transition" aria-label="إغلاق">
        <X size={18} />
      </button>
    </div>
  );
}

/** الخطاف المستخدم في كل المكونات: const { success, error, confirm } = useToast(); */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
