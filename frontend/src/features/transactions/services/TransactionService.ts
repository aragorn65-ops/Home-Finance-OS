import type { Transaction } from "../models/Transaction";
import TransactionRepository from "../repositories/TransactionRepository";

export default class TransactionService {
  /**
   * Returns all transactions.
   */
  static getTransactions(): Transaction[] {
    return TransactionRepository.findAll();
  }

  /**
   * Returns active income transactions.
   */
  static getIncomeTransactions(): Transaction[] {
    return this.getTransactions().filter(
      ({ type }) => type === "income"
    );
  }

  /**
   * Returns active expense transactions.
   */
  static getExpenseTransactions(): Transaction[] {
    return this.getTransactions().filter(
      ({ type }) => type === "expense"
    );
  }

  /**
   * Total income.
   */
  static getTotalIncome(): number {
    return this.sumAmounts(
      this.getIncomeTransactions()
    );
  }

  /**
   * Total expenses.
   */
  static getTotalExpenses(): number {
    return this.sumAmounts(
      this.getExpenseTransactions()
    );
  }

  /**
   * Net cash flow.
   */
  static getNetCashFlow(): number {
    return (
      this.getTotalIncome() -
      this.getTotalExpenses()
    );
  }

  /**
   * Returns the most recent transactions.
   */
  static getRecentTransactions(
    limit = 5
  ): Transaction[] {
    return [...this.getTransactions()]
      .sort(
        (a, b) =>
          b.transactionDate.getTime() -
          a.transactionDate.getTime()
      )
      .slice(0, limit);
  }

  /**
   * Shared helper for summing transaction amounts.
   */
  private static sumAmounts(
    transactions: Transaction[]
  ): number {
    return transactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );
  }
}