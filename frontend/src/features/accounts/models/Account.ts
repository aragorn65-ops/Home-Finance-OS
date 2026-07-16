import type { HouseholdMember } from "../../household/models/HouseholdMember";

export type AccountClass =
  | "asset"
  | "liability";

export type AccountVisibility =
  | "household"
  | "private";

export type AccountType =
  | "checking"
  | "savings"
  | "cash"
  | "e-wallet"
  | "investment"
  | "credit-card"
  | "line-of-credit"
  | "loan"
  | "mortgage"
  | "other-asset"
  | "other-liability";

export interface Account {
  id: string;
  householdId: string;

  /**
   * Household member who owns and controls the account.
   */
  ownerMemberId: HouseholdMember["id"];

  /**
   * Household accounts are visible to authorized
   * household members.
   *
   * Private accounts are visible only to their owner.
   */
  visibility: AccountVisibility;

  name: string;
  institution?: string;

  accountClass: AccountClass;
  type: AccountType;

  currency: string;

  /**
   * Asset account:
   * Balance represents available funds.
   *
   * Liability account:
   * Balance represents the outstanding amount owed.
   */
  openingBalance: number;
  currentBalance: number;

  accountNumber?: string;

  /**
   * Liability-specific fields.
   */
  creditLimit?: number;
  statementBalance?: number;
  minimumPayment?: number;
  paymentDueDate?: Date;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}