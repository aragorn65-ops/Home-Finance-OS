import type { HouseholdMember } from "../../household/models/HouseholdMember";

import type { Transaction } from "./Transaction";

import type {
  PersonalExpenseItem,
} from "./PersonalExpenseItem";

export type ExpenseSplitMethod =
  | "none"
  | "equal"
  | "exact"
  | "shared-personal"
  | "submeter";

export type AllocationPaymentStatus =
  | "unpaid"
  | "partially-paid"
  | "paid";

export interface ExpenseAllocation {
  id: string;

  transactionId: Transaction["id"];

  /**
   * Member who paid the original expense.
   *
   * Other included members may owe this member
   * their allocated shares.
   */
  paidByMemberId: HouseholdMember["id"];

  /**
   * Member responsible for this portion
   * of the expense.
   */
  memberId: HouseholdMember["id"];

  /**
   * False means the member opted out and receives
   * a zero allocation.
   */
  isIncluded: boolean;

  /**
   * Final amount assigned to this member.
   *
   * For shared-personal expenses:
   * common share + personal amount.
   *
   * For opted-out members, this must be zero.
   */
  allocatedAmount: number;

  /**
   * Total amount of items assigned exclusively
   * to this member.
   */
  personalAmount?: number;

  /**
   * Individual personal items assigned
   * exclusively to this member.
   *
   * Optional to remain compatible with
   * older saved allocations.
   */
  personalItems?: PersonalExpenseItem[];

  /**
   * Optional explanation for exclusions,
   * personal items, or manual adjustments.
   */
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}