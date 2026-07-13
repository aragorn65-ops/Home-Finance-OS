/**
 * Supported account types.
 */
export type AccountType =
  | "checking"
  | "savings"
  | "cash"
  | "credit-card"
  | "loan"
  | "investment"
  | "e-wallet"
  | "other";

/**
 * Represents a financial account within a household.
 */
export interface Account {
  /**
   * Unique identifier.
   */
  id: string;

  /**
   * Household that owns this account.
   */
  householdId: string;

  /**
   * Display name.
   * Example: "BDO Savings", "Cash Wallet"
   */
  name: string;

  /**
   * Financial institution.
   * Optional because cash accounts may not have one.
   */
  institution?: string;

  /**
   * Account classification.
   */
  type: AccountType;

  /**
   * ISO 4217 Currency Code.
   * Examples: USD, PHP, EUR
   */
  currency: string;

  /**
   * Balance when the account was first created.
   */
  openingBalance: number;

  /**
   * Current calculated balance.
   */
  currentBalance: number;

  /**
   * Optional masked account number.
   * Example: ****1234
   */
  accountNumber?: string;

  /**
   * Soft delete / active status.
   */
  isActive: boolean;

  /**
   * Date created.
   */
  createdAt: Date;

  /**
   * Date last modified.
   */
  updatedAt: Date;
}