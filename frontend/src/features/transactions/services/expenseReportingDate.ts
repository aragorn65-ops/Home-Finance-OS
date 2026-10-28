import UtilityProviderBillRepository from "../../utilities/repositories/UtilityProviderBillRepository";

// Reporting only: never change transaction dates, cash movements, or allocation order.
export function getExpenseReportingDate(
  householdId: string,
  transactionId: string,
  transactionDate: Date
): Date {
  const bill = UtilityProviderBillRepository.findActiveByHouseholdId(householdId)
    .find(candidate => candidate.transactionId === transactionId);
  return bill && Number.isFinite(bill.dueDate.getTime()) ? bill.dueDate : transactionDate;
}
