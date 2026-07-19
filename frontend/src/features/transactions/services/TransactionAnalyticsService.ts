import TransactionRepository from "../repositories/TransactionRepository";

export interface MonthlyCashFlowSummary {
  month: string;
  income: number;
  expenses: number;
}

export default class TransactionAnalyticsService {
  /**
   * Returns actual income and expense totals for the
   * six-month window ending at the reference month.
   */
  static getMonthlyCashFlow(
    referenceDate: Date = new Date()
  ): MonthlyCashFlowSummary[] {
    const months =
      Array.from(
        {
          length: 6,
        },
        (
          _,
          index
        ) =>
          new Date(
            referenceDate.getFullYear(),
            referenceDate.getMonth() -
              (5 - index),
            1
          )
      );

    const summaries =
      months.map(
        (monthDate) => ({
          month:
            new Intl.DateTimeFormat(
              undefined,
              {
                month: "short",
              }
            ).format(monthDate),
          income: 0,
          expenses: 0,
        })
      );

    const monthKeys =
      months.map(
        (monthDate) =>
          this.getMonthKey(
            monthDate
          )
      );

    const summaryByMonth =
      new Map(
        monthKeys.map(
          (key, index) => [
            key,
            summaries[index],
          ]
        )
      );

    TransactionRepository
      .findAll()
      .filter(
        (transaction) =>
          transaction.isActive
      )
      .forEach(
        (transaction) => {
          const summary =
            summaryByMonth.get(
              this.getMonthKey(
                transaction
                  .transactionDate
              )
            );

          if (!summary) {
            return;
          }

          if (
            transaction.type ===
            "income"
          ) {
            summary.income +=
              transaction.amount;
          }

          if (
            transaction.type ===
            "expense"
          ) {
            summary.expenses +=
              transaction.amount;
          }
        }
      );

    return summaries;
  }

  private static getMonthKey(
    date: Date
  ): string {
    return `${date.getFullYear()}-${date.getMonth()}`;
  }
}
