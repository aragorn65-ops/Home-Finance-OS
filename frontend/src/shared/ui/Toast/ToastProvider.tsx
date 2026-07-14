import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  ToastItem,
  ToastVariant,
} from "./Toast";

import ToastContext from "./ToastContext";

interface ToastProviderProps {
  children: ReactNode;
}

export default function ToastProvider({
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<
    ToastItem[]
  >([]);

  const remove = useCallback(
    (id: number) => {
      setToasts((current) =>
        current.filter(
          (toast) =>
            toast.id !== id
        )
      );
    },
    []
  );

  const show = useCallback(
    (
      message: string,
      variant: ToastVariant = "info"
    ) => {
      const id =
        Date.now() +
        Math.random();

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

      success: (
        message: string
      ) =>
        show(
          message,
          "success"
        ),

      error: (
        message: string
      ) =>
        show(
          message,
          "error"
        ),

      warning: (
        message: string
      ) =>
        show(
          message,
          "warning"
        ),

      info: (
        message: string
      ) =>
        show(
          message,
          "info"
        ),

      remove,
    }),
    [
      toasts,
      show,
      remove,
    ]
  );

  return (
    <ToastContext.Provider
      value={value}
    >
      {children}
    </ToastContext.Provider>
  );
}