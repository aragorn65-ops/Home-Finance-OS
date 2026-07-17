import type {
  Account,
} from "../../accounts/models/Account";

export type SavingsGoalType =
  | "emergency-fund"
  | "vacation"
  | "annual-insurance"
  | "home-repair"
  | "tuition"
  | "vehicle-maintenance"
  | "appliance-replacement"
  | "general"
  | "other";

export type SavingsGoalPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type SavingsGoalStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "paused"
  | "archived";

export interface SavingsGoal {
  id: string;
  householdId: string;

  name: string;
  description?: string;

  goalType: SavingsGoalType;

  /**
   * Desired amount to reserve for the goal.
   *
   * The current saved amount is not stored here.
   * It is derived from active savings activities.
   */
  targetAmount: number;
  goalCurrency: string;
  baseCurrency: string;
  targetBaseAmount: number;
  exchangeRate: number;
  exchangeRateEffectiveDate: Date;

  targetDate?: Date;

  /**
   * Optional asset account associated with the goal.
   *
   * Linking an account does not mean the complete account
   * balance belongs to this goal. Savings activities remain
   * the source of truth for goal progress.
   */
  linkedAccountId?: Account["id"];

  priority: SavingsGoalPriority;
  status: SavingsGoalStatus;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
