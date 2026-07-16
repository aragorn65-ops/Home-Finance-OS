import StatCard from "../../../../shared/ui/StatCard";
import Widget from "../../../../shared/ui/Widget";
import formatCurrency from "../../../../shared/utils/formatCurrency";

import DashboardService from "../../services/DashboardService";

export default function NetWorth() {
  const summary =
    DashboardService.getSummary();

  const household =
    DashboardService.getHouseholdSummary();

  return (
    <Widget title="Net Worth">
      <StatCard
        label="Current Net Worth"
        value={formatCurrency(
          summary.netWorth,
          household.currency
        )}
        subtitle={`${summary.totalAccounts} active account${
          summary.totalAccounts === 1
            ? ""
            : "s"
        }`}
      />
    </Widget>
  );
}
