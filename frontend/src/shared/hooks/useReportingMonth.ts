import {
  useCallback,
  useState,
} from "react";

import {
  formatMonthInput,
} from "../utils/monthSelection";

const reportingMonthStorageKey =
  "hfos.reportingMonth";

function getDefaultReportingMonth(): string {
  return formatMonthInput(
    new Date()
  );
}

function readReportingMonth(): string {
  if (typeof window === "undefined") {
    return getDefaultReportingMonth();
  }

  return (
    window.sessionStorage.getItem(
      reportingMonthStorageKey
    ) ?? getDefaultReportingMonth()
  );
}

export default function useReportingMonth() {
  const [
    selectedMonthValue,
    setSelectedMonthValueState,
  ] = useState(readReportingMonth);

  const setSelectedMonthValue =
    useCallback((nextMonth: string) => {
      setSelectedMonthValueState(
        nextMonth
      );

      window.sessionStorage.setItem(
        reportingMonthStorageKey,
        nextMonth
      );
    }, []);

  return {
    selectedMonthValue,
    setSelectedMonthValue,
  };
}
