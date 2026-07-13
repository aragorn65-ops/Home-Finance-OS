import React from "react";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export default function Select({
  label,
  helperText,
  error,
  options,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId =
    id ??
    props.name ??
    `select-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <select
        id={selectId}
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
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      {!error && helperText && (
        <p className="text-sm text-gray-500">
          {helperText}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}