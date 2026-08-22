import {
  useEffect,
  useState,
  type FocusEvent,
  type InputHTMLAttributes,
} from "react";

import parseCurrencyInputValue from "../utils/parseCurrencyInputValue";

export interface CurrencyInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "onChange"
  > {
  label?: string;
  helperText?: string;
  error?: string;
  value: number;
  onValueChange: (value: number) => void;
}

function formatCurrencyInputValue(
  value: number
): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  return value.toFixed(2);
}

export default function CurrencyInput({
  label,
  helperText,
  error,
  className = "",
  id,
  value,
  onValueChange,
  onFocus,
  onBlur,
  ...props
}: CurrencyInputProps) {
  const inputId =
    id ??
    props.name ??
    `currency-input-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

  const [
    displayValue,
    setDisplayValue,
  ] = useState(
    value === 0
      ? ""
      : formatCurrencyInputValue(value)
  );

  const [
    isFocused,
    setIsFocused,
  ] = useState(false);

  useEffect(() => {
    if (isFocused) {
      return;
    }

    setDisplayValue(
      value === 0
        ? ""
        : formatCurrencyInputValue(value)
    );
  }, [
    value,
    isFocused,
  ]);

  const handleBlur = (
    event: FocusEvent<HTMLInputElement>
  ) => {
    setIsFocused(false);

    const nextValue =
      parseCurrencyInputValue(
        displayValue
      );

    setDisplayValue(
      nextValue === 0
        ? ""
        : formatCurrencyInputValue(
            nextValue
          )
    );

    onValueChange(nextValue);
    onBlur?.(event);
  };

  const handleFocus = (
    event: FocusEvent<HTMLInputElement>
  ) => {
    setIsFocused(true);
    onFocus?.(event);
  };

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
        type="text"
        inputMode="decimal"
        value={displayValue}
        onFocus={handleFocus}
        onChange={(event) => {
          setDisplayValue(
            event.target.value
          );

          onValueChange(
            parseCurrencyInputValue(
              event.target.value
            )
          );
        }}
        onBlur={handleBlur}
        placeholder="0.00"
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
