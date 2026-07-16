import "./DashboardSummary.css";

import StatCard from "../../../../shared/ui/StatCard";
import Widget from "../../../../shared/ui/Widget";
import formatCurrency from "../../../../shared/utils/formatCurrency";

import DashboardService from "../../services/DashboardService";

export default function DashboardSummary() {
  const summary =
    DashboardService.getSummary();

  const household =
    DashboardService.getHouseholdSummary();

  return (
    <Widget title="Dashboard Summary">
      <div className="hfos-dashboard-summary">
        <div className="hfos-dashboard-summary__metric">
          <StatCard
            label="Accounts"
            value={summary.totalAccounts.toString()}
          />
        </div>

        <div className="hfos-dashboard-summary__metric">
          <StatCard
            label="Total Balance"
            value={formatCurrency(
              summary.totalAccountBalance,
              household.currency
            )}
          />
        </div>

        <div className="hfos-dashboard-summary__metric">
          <StatCard
            label="Net Worth"
            value={formatCurrency(
              summary.netWorth,
              household.currency
            )}
          />
        </div>
      </div>
    </Widget>
  );
}
