import type {
  TransactionType,
  TransactionVisibility,
} from "./Transaction";

import type {
  ExpenseAllocationForm,
} from "./ExpenseAllocationForm";

import type {
  ExpenseSplitMethod,
} from "./ExpenseAllocation";

export interface TransactionForm {
  type: TransactionType;
  amount: number;

  /**
   * Member who paid or recorded the transaction.
   *
   * For expenses, this identifies the member who
   * should be reimbursed by other participants.
   */
  paidByMemberId: string;

  /**
   * Controls who may view the transaction.
   *
   * Shared expenses paid from private accounts should
   * normally use "participants".
   */
  visibility: TransactionVisibility;

  sourceAccountId: string;
  destinationAccountId: string;

  category: string;
  description: string;
  notes: string;

  transactionDate: string;

  /**
   * Expense splitting method.
   *
   * Income and transfers should use "none".
   */
  splitMethod: ExpenseSplitMethod;

  /**
   * Member-level shares for expense transactions.
   *
   * Opted-out members remain in the collection with
   * isIncluded set to false and allocatedAmount set to 0.
   */
  allocations: ExpenseAllocationForm[];

  isActive: boolean;
}

export const defaultTransactionForm: TransactionForm = {
  type: "expense",
  amount: 0,

  paidByMemberId: "",
  visibility: "household",

  sourceAccountId: "",
  destinationAccountId: "",

  category: "",
  description: "",
  notes: "",

  transactionDate: "",

  splitMethod: "none",
  allocations: [],

  isActive: true,
};