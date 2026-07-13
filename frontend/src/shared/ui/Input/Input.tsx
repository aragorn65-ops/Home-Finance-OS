import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId =
    id ?? props.name ?? `input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        className={[
          "w-full rounded-lg border border-gray-300",
          "px-3 py-2",
          "text-sm",
          "outline-none",
          "transition",
          "focus:border-blue-500",
          "focus:ring-2 focus:ring-blue-500/20",
          "disabled:bg-gray-100",
          error ? "border-red-500" : "",
          className,
        ].join(" ")}
        {...props}
      />

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}