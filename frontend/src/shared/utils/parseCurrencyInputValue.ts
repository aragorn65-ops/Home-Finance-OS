export default function parseCurrencyInputValue(
  value: string
): number {
  const normalizedValue = value
    .trim()
    .replace(/,/g, "");

  if (normalizedValue === "") {
    return 0;
  }

  const parsedValue = Number(
    normalizedValue
  );

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return Math.round(
    parsedValue * 100
  ) / 100;
}
