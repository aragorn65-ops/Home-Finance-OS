import type { HouseholdMember } from "../../household/models/HouseholdMember";
import type { Transaction } from "./Transaction";

export type ExpenseSplitMethod =
  | "none"
  | "equal"
  | "exact"
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
   * For opted-out members, this must be zero.
   */
  allocatedAmount: number;

  /**
   * Optional explanation for exclusions or
   * manual allocation adjustments.
   */
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}