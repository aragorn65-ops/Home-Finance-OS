import type { ExpenseAllocation } from "../../transactions/models/ExpenseAllocation";

export interface SettlementApplicationForm {
  /**
   * Expense allocation receiving part or all
   * of the settlement payment.
   */
  expenseAllocationId: ExpenseAllocation["id"];

  /**
   * Controls whether the allocation is included
   * in a manual settlement.
   */
  isSelected: boolean;

  /**
   * Amount from the settlement applied
   * to this expense allocation.
   */
  appliedAmount: number;
}

export function createSettlementApplicationForm(
  expenseAllocationId: ExpenseAllocation["id"],
  isSelected = false
): SettlementApplicationForm {
  return {
    expenseAllocationId,
    isSelected,
    appliedAmount: 0,
  };
}