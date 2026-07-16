import AccountService from "../../accounts/services/AccountService";

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

export default class DashboardService {
  /**
   * Returns household information.
   *
   * TODO:
   * Replace with HouseholdService in a future sprint.
   */
  static getHouseholdSummary(): HouseholdSummary {
    return {
      householdName: "The Bunsoy Family",
      country: "Philippines",
      currency: "PHP",
      timezone: "Asia/Manila",
    };
  }

  /**
   * Returns the number of active accounts.
   */
  static getTotalAccounts(): number {
    return AccountService.getActiveAccounts().length;
  }

  /**
   * Returns the total balance of active accounts.
   */
  static getTotalAccountBalance(): number {
    return AccountService.getTotalBalance();
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
    return this.getTotalAccountBalance();
  }

  /**
   * Returns the dashboard summary.
   */
  static getSummary(): DashboardSummary {
    return {
      totalAccounts: this.getTotalAccounts(),
      totalAccountBalance:
        this.getTotalAccountBalance(),
      netWorth: this.getNetWorth(),
    };
  }
}