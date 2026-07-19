export function formatMonthInput(
  date: Date
): string {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
}

export function parseMonthInput(
  value: string
): Date {
  const [
    yearValue,
    monthValue,
  ] = value.split("-");

  const year =
    Number(yearValue);

  const monthIndex =
    Number(monthValue) - 1;

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return new Date();
  }

  return new Date(
    year,
    monthIndex,
    1
  );
}

export function formatDateInput(
  date: Date
): string {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatMonthLabel(
  date: Date
): string {
  return new Intl.DateTimeFormat(
    undefined,
    {
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

export function isSameMonth(
  date: Date,
  referenceDate: Date
): boolean {
  return (
    date.getFullYear() ===
      referenceDate.getFullYear() &&
    date.getMonth() ===
      referenceDate.getMonth()
  );
}
