import type { ExpenseAllocation } from "../../transactions/models/ExpenseAllocation";

import type { AllocationPaymentStatus } from "../../transactions/models/ExpenseAllocation";

export interface SettlementAllocationOption {
  expenseAllocationId:
    ExpenseAllocation["id"];

  transactionId:
    ExpenseAllocation["transactionId"];

  /**
   * Member responsible for paying the allocation.
   */
  fromMemberId:
    ExpenseAllocation["memberId"];

  /**
   * Member who paid the original expense
   * and should receive reimbursement.
   */
  toMemberId:
    ExpenseAllocation["paidByMemberId"];

  transactionDate: Date;

  category: string;
  description: string;

  allocatedAmount: number;
  paidAmount: number;
  outstandingAmount: number;

  paymentStatus:
    AllocationPaymentStatus;
}