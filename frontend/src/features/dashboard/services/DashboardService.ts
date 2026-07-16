import AccountService from "../../accounts/services/AccountService";

import {
  loadHousehold,
} from "../../household/services/householdStorage";

export interface HouseholdSummary {
  householdName: string;
  country: string;
  currency: string;
  timezone: string;
}

export interface DashboardSummary {
  totalAccounts: number;
  totalAccountBalance: number;
  netWorth: number;
}

const EMPTY_HOUSEHOLD_SUMMARY:
  HouseholdSummary = {
    householdName:
      "Household not configured",
    country:
      "Not configured",
    currency:
      "PHP",
    timezone:
      "Not configured",
  };

export default class DashboardService {
  /**
   * Returns information for the single active household.
   */
  static getHouseholdSummary():
    HouseholdSummary {
    const household =
      loadHousehold();

    if (!household) {
      return {
        ...EMPTY_HOUSEHOLD_SUMMARY,
      };
    }

    return {
      householdName:
        household.householdName,

      country:
        household.country,

      currency:
        household.currency,

      timezone:
        household.timezone,
    };
  }

  /**
   * Returns the number of active accounts.
   */
  static getTotalAccounts(): number {
    return AccountService
      .getActiveAccounts()
      .length;
  }

  /**
   * Returns the total balance of active accounts.
   */
  static getTotalAccountBalance(): number {
    return AccountService
      .getTotalBalance();
  }

  /**
   * Returns the current net worth.
   *
   * MVP:
   * Net Worth = Total Account Balance
   *
   * Future:
   * Assets
   * + Investments
   * + Cash
   * - Liabilities
   */
  static getNetWorth(): number {
    return this
      .getTotalAccountBalance();
  }

  /**
   * Returns the dashboard summary.
   */
  static getSummary(): DashboardSummary {
    return {
      totalAccounts:
        this.getTotalAccounts(),

      totalAccountBalance:
        this.getTotalAccountBalance(),

      netWorth:
        this.getNetWorth(),
    };
  }
}
