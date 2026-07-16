import Widget from "../../../../shared/ui/Widget";
import StatCard from "../../../../shared/ui/StatCard";

import DashboardService from "../../services/DashboardService";

export default function NetWorth() {
  const summary =
    DashboardService.getSummary();

  return (
    <Widget title="Net Worth">
      <StatCard
        label="Current Net Worth"
        value={`₱${summary.netWorth.toLocaleString()}`}
        subtitle={`${summary.totalAccounts} Active Account${
          summary.totalAccounts === 1 ? "" : "s"
        }`}
      />
    </Widget>
  );
}