import type {
  SavingsGoalPriority,
  SavingsGoalStatus,
  SavingsGoalType,
} from "./SavingsGoal";
import type {
  ExchangeRateSource,
} from "../../../shared/services/CurrencyRateProvider";

export interface SavingsGoalForm {
  householdId: string;

  name: string;
  description: string;

  goalType: SavingsGoalType;

  targetAmount: number;
  goalCurrency: string;
  exchangeRate: number;
  exchangeRateSource: ExchangeRateSource;
  exchangeRateProvider: string;
  targetDate: string;

  /**
   * Optional asset account associated with the goal.
   *
   * An empty string means that no account is linked.
   */
  linkedAccountId: string;

  priority: SavingsGoalPriority;
  status: SavingsGoalStatus;

  isActive: boolean;
}

export const defaultSavingsGoalForm:
  SavingsGoalForm = {
    householdId: "",

    name: "",
    description: "",

    goalType: "general",

    targetAmount: 0,
    goalCurrency: "",
    exchangeRate: 1,
    exchangeRateSource: "manual",
    exchangeRateProvider: "",
    targetDate: "",

    linkedAccountId: "",

    priority: "medium",
    status: "not-started",

    isActive: true,
  };
