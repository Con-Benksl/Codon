import { X } from 'lucide-react';

export type DesignerToastType = 'error' | 'info' | 'success';

export interface DesignerToast {
  id: string;
  type: DesignerToastType;
  message: string;
}

interface DesignerToastViewportProps {
  toasts: DesignerToast[];
  onDismiss: (id: string) => void;
}

const TOAST_STYLE: Record<DesignerToastType, string> = {
  error: 'border-red-500/35 bg-red-500/15 text-red-100',
  info: 'border-primary/35 bg-primary/15 text-text',
  success: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-100',
};

export default function DesignerToastViewport({
  toasts,
  onDismiss,
}: DesignerToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="fixed bottom-5 right-5 z-50 flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-3"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-md ${TOAST_STYLE[toast.type]}`}
        >
          <p className="min-w-0 flex-1 text-sm leading-relaxed">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-current opacity-75 transition hover:opacity-100"
            aria-label="关闭提示"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
