import "./Input.css";

import type {
  InputHTMLAttributes,
} from "react";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export default function Input({
  label,
  helperText,
  error,
  id,
  ...props
}: InputProps) {
  return (
    <div className="hfos-input">

      {label && (
        <label htmlFor={id}>
          {label}
        </label>
      )}

      <input
        id={id}
        {...props}
      />

      {helperText && !error && (
        <small>{helperText}</small>
      )}

      {error && (
        <small className="error">
          {error}
        </small>
      )}

    </div>
  );
}