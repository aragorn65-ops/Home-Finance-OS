import type {
  SavingsActivityType,
} from "./SavingsActivity";
import type {
  ExchangeRateSource,
} from "../../../shared/services/CurrencyRateProvider";

export interface SavingsActivityForm {
  householdId: string;
  savingsGoalId: string;

  /**
   * Household member responsible for the activity.
   *
   * This is used when validating access to private
   * financial accounts.
   */
  memberId: string;

  activityType: SavingsActivityType;

  /**
   * Contributions and withdrawals require a positive
   * amount.
   *
   * Adjustments may use either a positive or negative
   * amount.
   */
  amount: number;
  enteredAmount: number;
  enteredCurrency: string;
  baseAmount: number;
  exchangeRate: number;
  exchangeRateSource: ExchangeRateSource;
  exchangeRateProvider: string;

  activityDate: string;

  /**
   * Optional account affected by the activity.
   *
   * An empty string means no account balance effect.
   */
  accountId: string;

  notes: string;

  isActive: boolean;
}

export const defaultSavingsActivityForm:
  SavingsActivityForm = {
    householdId: "",
    savingsGoalId: "",

    memberId: "",

    activityType: "contribution",
    amount: 0,
    enteredAmount: 0,
    enteredCurrency: "",
    baseAmount: 0,
    exchangeRate: 1,
    exchangeRateSource: "manual",
    exchangeRateProvider: "",

    activityDate: "",

    accountId: "",
    notes: "",

    isActive: true,
  };
