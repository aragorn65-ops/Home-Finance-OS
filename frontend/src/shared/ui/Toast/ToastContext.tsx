import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant =
  | "success"
  | "error"
  | "warning"
  | "info";

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: ToastItem[];
  show: (
    message: string,
    variant?: ToastVariant
  ) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  remove: (id: number) => void;
}

const ToastContext =
  createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<
    ToastItem[]
  >([]);

  const remove = useCallback((id: number) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }, []);

  const show = useCallback(
    (
      message: string,
      variant: ToastVariant = "info"
    ) => {
      const id = Date.now() + Math.random();

      setToasts((current) => [
        ...current,
        {
          id,
          message,
          variant,
        },
      ]);

      window.setTimeout(() => {
        remove(id);
      }, 4000);
    },
    [remove]
  );

  const value = useMemo(
    () => ({
      toasts,
      show,
      success: (message: string) =>
        show(message, "success"),
      error: (message: string) =>
        show(message, "error"),
      warning: (message: string) =>
        show(message, "warning"),
      info: (message: string) =>
        show(message, "info"),
      remove,
    }),
    [toasts, show, remove]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToastContext must be used within a ToastProvider."
    );
  }

  return context;
}