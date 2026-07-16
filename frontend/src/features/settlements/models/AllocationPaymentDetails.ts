import type {
  AllocationPaymentStatus,
  ExpenseAllocation,
} from "../../transactions/models/ExpenseAllocation";

export interface AllocationPaymentDetails {
  expenseAllocationId: ExpenseAllocation["id"];

  /**
   * Member who paid the original expense
   * and may be entitled to reimbursement.
   */
  paidByMemberId: ExpenseAllocation["paidByMemberId"];

  /**
   * Member responsible for the allocation.
   */
  memberId: ExpenseAllocation["memberId"];

  /**
   * Original amount assigned to the member.
   */
  allocatedAmount: number;

  /**
   * Total amount applied through active settlements.
   */
  paidAmount: number;

  /**
   * Remaining reimbursable amount.
   *
   * A payer's own allocation has no outstanding
   * reimbursement obligation.
   */
  outstandingAmount: number;

  /**
   * Derived from paid and outstanding amounts.
   */
  paymentStatus: AllocationPaymentStatus;

  /**
   * True when the allocation belongs to the member
   * who originally paid the expense.
   */
  isSelfAllocation: boolean;
}