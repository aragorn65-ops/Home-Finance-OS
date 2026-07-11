export type TransactionType =
  | "income"
  | "expense"
  | "transfer";

export interface Transaction {
  id: string;

  householdId: string;

  accountId: string;

  categoryId: string;

  payee?: string;

  description?: string;

  amount: number;

  type: TransactionType;

  transactionDate: Date;

  createdAt: Date;

  updatedAt: Date;

  notes?: string;

  tags?: string[];
}