import {
  createContext,
} from "react";

import type {
  ToastItem,
  ToastVariant,
} from "./Toast";

export interface ToastContextValue {
  toasts: ToastItem[];

  show: (
    message: string,
    variant?: ToastVariant
  ) => void;

  success: (
    message: string
  ) => void;

  error: (
    message: string
  ) => void;

  warning: (
    message: string
  ) => void;

  info: (
    message: string
  ) => void;

  remove: (
    id: number
  ) => void;
}

const ToastContext =
  createContext<
    ToastContextValue | null
  >(null);

export default ToastContext;