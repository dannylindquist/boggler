import { Handle } from "@remix-run/component";
import { TypedEventTarget } from "@remix-run/interaction";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning";
  duration?: number;
}

class ToastController extends TypedEventTarget<{ change: Event }> {
  toasts: Toast[] = [];

  constructor() {
    super();
    this.toasts = [];
  }

  addToast(toast: Toast) {
    this.toasts.push(toast);
    this.dispatchEvent(new Event("change"));
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== toast.id);
      this.dispatchEvent(new Event("change"));
    }, toast.duration ?? 3000);
  }
}

const toastController = new ToastController();
export const showToast = (
  message: string,
  type: "success" | "error" | "warning",
  duration = 3000
) => {
  const id = Math.random().toString(36).substr(2, 9);
  const toast: Toast = { id, message, type, duration };

  toastController.addToast(toast);
};

export function ToastContainer(this: Handle) {
  this.on(toastController, {
    change: () => this.update(),
  });
  return () => (
    <div className="toast-container">
      {toastController.toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
