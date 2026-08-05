import {
  isSameMonth,
} from "../../../shared/utils/monthSelection";

import type {
  UtilityProviderBill,
} from "../models/UtilityProviderBill";

export function getProviderBillsPaidInMonth(
  providerBills: UtilityProviderBill[],
  selectedMonth: Date
): UtilityProviderBill[] {
  return providerBills.filter(
    (providerBill) =>
      providerBill.paidAt !== null &&
      isSameMonth(
        providerBill.paidAt,
        selectedMonth
      )
  );
}
