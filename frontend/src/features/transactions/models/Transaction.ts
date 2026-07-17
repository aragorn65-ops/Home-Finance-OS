import type {
  StoredAttachment,
} from "../../../shared/models/StoredAttachment";

import type { HouseholdMember } from "../../household/models/HouseholdMember";

import type {
  ExpenseSplitMethod,
} from "./ExpenseAllocation";

export type TransactionType =
  | "income"
  | "expense"
  | "transfer";

export type TransactionVisibility =
  | "household"
  | "participants"
  | "private";

export interface Transaction {
  id: string;
  householdId: string;

  /**
   * Member who recorded the transaction.
   */
  createdByMemberId?: HouseholdMember["id"];

  /**
   * Member who paid an expense.
   *
   * Used for reimbursements and settlements.
   */
  paidByMemberId?: HouseholdMember["id"];

  /**
   * Original expense division method.
   *
   * Undefined for income, transfers, and legacy records.
   */
  expenseSplitMethod?: ExpenseSplitMethod;

  /**
   * Controls who may view the transaction.
   */
  visibility?: TransactionVisibility;

  type: TransactionType;
  amount: number;
  enteredAmount?: number;
  enteredCurrency?: string;
  baseCurrency?: string;
  baseAmount?: number;
  exchangeRate?: number;
  exchangeRateEffectiveDate?: Date;

  sourceAccountId: string | null;
  destinationAccountId: string | null;

  category: string;
  description: string;
  notes: string;

  /**
   * Locally stored receipts, bills, or supporting files.
   *
   * Optional for compatibility with transactions saved
   * before attachment support was introduced.
   */
  attachments?: StoredAttachment[];

  transactionDate: Date;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
