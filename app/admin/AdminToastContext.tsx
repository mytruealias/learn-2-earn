"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { IconButton } from "../components/ui";
import { CloseIcon } from "../components/icons";
import styles from "./toast.module.css";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const typeClass: Record<ToastType, string> = {
    success: styles.toastSuccess,
    error: styles.toastError,
    info: styles.toastInfo,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((t) => (
          <div key={t.id} data-design="notification" role={t.type === "error" ? "alert" : "status"} aria-atomic="true" className={`${styles.toast} ${typeClass[t.type]}`}>
            <span className={styles.toastMsg}>{t.message}</span>
            <IconButton label="Dismiss notification" onClick={() => dismiss(t.id)}><CloseIcon /></IconButton>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
