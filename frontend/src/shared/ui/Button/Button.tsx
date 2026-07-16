import "./Button.css";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = [
    "hfos-button",
    `hfos-button--${variant}`,
    fullWidth ? "hfos-button--full-width" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}
