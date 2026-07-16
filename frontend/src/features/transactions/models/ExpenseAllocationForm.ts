import type { HouseholdMember } from "../../household/models/HouseholdMember";

import type {
  PersonalExpenseItem,
} from "./PersonalExpenseItem";

export interface ExpenseAllocationForm {
  memberId: HouseholdMember["id"];

  /**
   * Controls whether the member participates
   * in the shared portion of the expense.
   */
  isIncluded: boolean;

  /**
   * Final amount assigned to the member.
   *
   * For shared-personal splits:
   * common share + personal amount.
   */
  allocatedAmount: number;

  /**
   * Total value of all personal items assigned
   * exclusively to this member.
   *
   * This is calculated from personalItems.
   */
  personalAmount: number;

  /**
   * Individual personal items assigned
   * exclusively to this member.
   */
  personalItems: PersonalExpenseItem[];

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
    personalAmount: 0,
    personalItems: [],
    notes: "",
  };
}