import type { Account } from "../models/Account";
import AccountRepository from "../repositories/AccountRepository";

export default class AccountService {
  /**
   * Returns all accounts.
   */
  static getAccounts(): Account[] {
    return AccountRepository.findAll();
  }

  /**
   * Returns active accounts.
   */
  static getActiveAccounts(): Account[] {
    return this.getAccounts().filter(
      (account) => account.isActive
    );
  }

  /**
   * Calculates the total balance of all active accounts.
   */
  static getTotalBalance(): number {
    return this.getActiveAccounts().reduce(
      (total, account) => total + account.currentBalance,
      0
    );
  }

  /**
   * Finds an account by ID.
   */
  static getAccountById(id: string): Account | undefined {
    return this.getAccounts().find(
      (account) => account.id === id
    );
  }
}