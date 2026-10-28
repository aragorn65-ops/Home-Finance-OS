import {
  isSameMonth,
} from "../../../shared/utils/monthSelection";

import type {
  UtilityProviderBill,
} from "../models/UtilityProviderBill";

export function getPaidProviderBillsForDueMonth(
  providerBills: UtilityProviderBill[],
  selectedMonth: Date
): UtilityProviderBill[] {
  return providerBills.filter(
    (providerBill) =>
      providerBill.status === "paid" &&
      isSameMonth(
        providerBill.dueDate,
        selectedMonth
      )
  );
}
