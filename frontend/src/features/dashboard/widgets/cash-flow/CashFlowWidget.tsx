import "./CashFlowWidget.css";

import Widget from "../../../../shared/ui/Widget";
import formatCurrency from "../../../../shared/utils/formatCurrency";

import DashboardService from "../../services/DashboardService";
import TransactionAnalyticsService from "../../../transactions/services/TransactionAnalyticsService";
import TransactionService from "../../../transactions/services/TransactionService";

export default function CashFlowWidget() {
  const household =
    DashboardService.getHouseholdSummary();

  const totalIncome =
    TransactionService.getTotalIncome();

  const totalExpenses =
    TransactionService.getTotalExpenses();

  const netCashFlow =
    TransactionService.getNetCashFlow();

  const monthlyData =
    TransactionAnalyticsService
      .getMonthlyCashFlow();

  const maximumNetMagnitude =
    Math.max(
      1,
      ...monthlyData.map(
        (item) =>
          Math.abs(
            item.income -
              item.expenses
          )
      )
    );

  return (
    <Widget title="Cash Flow">
      <table className="hfos-cash-flow__table">
        <tbody>
          <tr>
            <td>Total Income</td>

            <td>
              {formatCurrency(
                totalIncome,
                household.currency
              )}
            </td>
          </tr>

          <tr>
            <td>Total Expenses</td>

            <td>
              {formatCurrency(
                totalExpenses,
                household.currency
              )}
            </td>
          </tr>

          <tr className="hfos-cash-flow__total">
            <td>Net Cash Flow</td>

            <td>
              {formatCurrency(
                netCashFlow,
                household.currency
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="hfos-cash-flow__trend">
        <h3 className="hfos-cash-flow__trend-title">
          Last 6 Months
        </h3>

        {monthlyData.map((item) => {
          const net =
            item.income -
            item.expenses;

          const widthPercentage =
            Math.min(
              Math.abs(net) /
                maximumNetMagnitude *
                100,
              100
            );

          return (
            <div
              key={item.month}
              className="hfos-cash-flow__trend-row"
            >
              <span className="hfos-cash-flow__month">
                {item.month}
              </span>

              <div
                className="hfos-cash-flow__bar-track"
                aria-hidden="true"
              >
                <div
                  className="hfos-cash-flow__bar"
                  style={{
                    width:
                      `${widthPercentage}%`,
                  }}
                />
              </div>

              <span className="hfos-cash-flow__value">
                {formatCurrency(
                  net,
                  household.currency
                )}
              </span>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}
