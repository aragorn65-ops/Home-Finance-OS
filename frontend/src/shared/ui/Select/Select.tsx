import "./Select.css";

import type {
  SelectHTMLAttributes,
} from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export default function Select({
  label,
  helperText,
  error,
  id,
  options,
  ...props
}: SelectProps) {
  return (
    <div className="hfos-select">

      {label && (
        <label htmlFor={id}>
          {label}
        </label>
      )}

      <select
        id={id}
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