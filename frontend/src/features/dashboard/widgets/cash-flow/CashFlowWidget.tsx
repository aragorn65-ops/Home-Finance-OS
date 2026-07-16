import Widget from "../../../../shared/ui/Widget";
import "./CashFlowWidget.css";
import TransactionService from "../../../transactions/services/TransactionService";
import TransactionAnalyticsService from "../../../transactions/services/TransactionAnalyticsService";


export default function CashFlowWidget() {
  // Summary comes from the service
  const totalIncome = TransactionService.getTotalIncome();
  const totalExpenses = TransactionService.getTotalExpenses();
  const netCashFlow = TransactionService.getNetCashFlow();

 const monthlyData = TransactionAnalyticsService.getMonthlyCashFlow();

  const maxNet = Math.max(
    ...monthlyData.map((item) => item.income - item.expenses)
  );

  return (
    <Widget title="Cash Flow">
      <table className="cashflow-table">
        <tbody>
          <tr>
            <td>Total Income</td>
            <td>₱{totalIncome.toLocaleString()}</td>
          </tr>

          <tr>
            <td>Total Expenses</td>
            <td>₱{totalExpenses.toLocaleString()}</td>
          </tr>

          <tr className="cashflow-total">
            <td>Net Cash Flow</td>
            <td>₱{netCashFlow.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div className="cashflow-trend">
        <h4>Last 6 Months</h4>

        {monthlyData.map((item) => {
          const net = item.income - item.expenses;

          return (
            <div
              key={item.month}
              className="trend-row"
            >
              <span className="trend-month">
                {item.month}
              </span>

              <div className="trend-bar-container">
                <div
                  className="trend-bar"
                  style={{
                    width: `${(net / maxNet) * 100}%`,
                  }}
                />
              </div>

              <span className="trend-value">
                ₱{net.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}