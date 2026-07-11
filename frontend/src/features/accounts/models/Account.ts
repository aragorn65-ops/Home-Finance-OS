export type AccountType =
  | "checking"
  | "savings"
  | "cash"
  | "credit-card"
  | "loan"
  | "investment"
  | "e-wallet"
  | "other";

export interface Account {
  id: string;

  householdId: string;

  name: string;

  institution?: string;

  type: AccountType;

  currency: string;

  openingBalance: number;

  currentBalance: number;

  accountNumber?: string;

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;
}