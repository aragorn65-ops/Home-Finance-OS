export interface MonthlyCashFlowSummary {
  month: string;
  income: number;
  expenses: number;
}

export default class TransactionAnalyticsService {
  /**
   * Demo monthly cash flow.
   * TODO: Generate from transactions.
   */
  static getMonthlyCashFlow(): MonthlyCashFlowSummary[] {
    return [
      { month: "Jan", income: 8200, expenses: 6400 },
      { month: "Feb", income: 7900, expenses: 5900 },
      { month: "Mar", income: 8500, expenses: 6100 },
      { month: "Apr", income: 9100, expenses: 6700 },
      { month: "May", income: 8700, expenses: 6400 },
      { month: "Jun", income: 8500, expenses: 6125 },
    ];
  }
}
