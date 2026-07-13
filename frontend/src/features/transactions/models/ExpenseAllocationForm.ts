import type { HouseholdMember } from "../../household/models/HouseholdMember";

export interface ExpenseAllocationForm {
  /**
   * Member receiving this share of the expense.
   */
  memberId: HouseholdMember["id"];

  /**
   * False means the member opted out.
   *
   * Opted-out members must receive a zero allocation.
   */
  isIncluded: boolean;

  /**
   * Calculated or manually entered share.
   *
   * Equal splits calculate this automatically.
   * Exact splits accept manual values.
   */
  allocatedAmount: number;

  /**
   * Optional explanation for an opt-out,
   * adjustment, or exact allocation.
   */
  notes: string;
}

export function createExpenseAllocationForm(
  memberId: HouseholdMember["id"],
  isIncluded = true
): ExpenseAllocationForm {
  return {
    memberId,
    isIncluded,
    allocatedAmount: 0,
    notes: "",
  };
}