import type {
  Account,
} from "../../accounts/models/Account";

import type {
  HouseholdMember,
} from "../../household/models/HouseholdMember";

import type {
  SavingsGoal,
} from "./SavingsGoal";

export type SavingsActivityType =
  | "contribution"
  | "withdrawal"
  | "adjustment";

export interface SavingsActivity {
  id: string;
  householdId: string;

  savingsGoalId: SavingsGoal["id"];

  /**
   * Household member responsible for the activity.
   *
   * This is required when validating access to a private
   * source or destination account.
   */
  memberId: HouseholdMember["id"];

  activityType: SavingsActivityType;

  /**
   * Contributions and withdrawals store positive amounts.
   *
   * Adjustments may store either a positive or negative
   * amount:
   * - Positive adjustment increases saved funds.
   * - Negative adjustment decreases saved funds.
   */
  amount: number;
  enteredAmount: number;
  enteredCurrency: string;
  goalCurrencyAmount: number;
  goalCurrency: string;
  baseCurrency: string;
  baseAmount: number;
  exchangeRate: number;
  exchangeRateEffectiveDate: Date;

  activityDate: Date;

  /**
   * Optional financial account affected by the activity.
   *
   * Contribution:
   * Funds are removed from the selected account.
   *
   * Withdrawal:
   * Funds are returned to the selected account.
   *
   * Adjustment:
   * Account effects follow the adjustment direction.
   */
  accountId?: Account["id"];

  notes?: string;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
