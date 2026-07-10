import "./Badge.css";
import type { ReactNode } from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

export default function Badge({
  children,
  variant = "neutral",
}: BadgeProps) {
  return (
    <span className={`hfos-badge ${variant}`}>
      {children}
    </span>
  );
}