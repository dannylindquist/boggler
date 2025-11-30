import { signal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
  duration?: number;
}

export const toasts = signal<Toast[]>([]);

export const showToast = (message: string, type: "success" | "error", duration = 3000) => {
  const id = Math.random().toString(36).substr(2, 9);
  const toast: Toast = { id, message, type, duration };
  
  toasts.value = [...toasts.value, toast];
  
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, duration);
};

export const ToastContainer = () => {
  return (
    <div className="toast-container">
      {toasts.value.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};
