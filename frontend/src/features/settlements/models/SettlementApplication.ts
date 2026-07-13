import type { ExpenseAllocation } from "../../transactions/models/ExpenseAllocation";
import type { Settlement } from "./Settlement";

export interface SettlementApplication {
  id: string;

  settlementId: Settlement["id"];

  /**
   * Expense allocation receiving part or all
   * of the settlement payment.
   */
  expenseAllocationId: ExpenseAllocation["id"];

  /**
   * Amount from the settlement applied to
   * this specific expense allocation.
   */
  appliedAmount: number;

  createdAt: Date;
  updatedAt: Date;
}