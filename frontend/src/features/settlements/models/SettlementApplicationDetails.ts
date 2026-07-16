import type {
  AllocationPaymentStatus,
  ExpenseAllocation,
} from "../../transactions/models/ExpenseAllocation";

import type { SettlementApplication } from "./SettlementApplication";

export interface SettlementApplicationDetails {
  settlementApplicationId:
    SettlementApplication["id"];

  expenseAllocationId:
    ExpenseAllocation["id"];

  transactionId:
    ExpenseAllocation["transactionId"];

  transactionDate: Date;

  category: string;
  description: string;

  /**
   * Original amount assigned to the debtor.
   */
  allocatedAmount: number;

  /**
   * Amount applied by this specific settlement.
   */
  appliedAmount: number;

  /**
   * Total amount paid across all active settlements.
   */
  paidAmount: number;

  /**
   * Remaining amount after all active applications.
   */
  outstandingAmount: number;

  /**
   * Derived allocation payment status.
   */
  paymentStatus: AllocationPaymentStatus;
}