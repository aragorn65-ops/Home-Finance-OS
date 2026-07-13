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