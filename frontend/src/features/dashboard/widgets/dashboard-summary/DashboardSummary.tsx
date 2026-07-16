import Widget from "../../../../shared/ui/Widget";
import StatCard from "../../../../shared/ui/StatCard";

import DashboardService from "../../services/DashboardService";

export default function DashboardSummary() {
  const summary = DashboardService.getSummary();

  return (
    <Widget title="Dashboard Summary">
      <div className="space-y-4">
        <StatCard
          label="Accounts"
          value={summary.totalAccounts.toString()}
        />

        <StatCard
          label="Total Balance"
          value={`₱${summary.totalAccountBalance.toLocaleString()}`}
        />

        <StatCard
          label="Net Worth"
          value={`₱${summary.netWorth.toLocaleString()}`}
        />
      </div>
    </Widget>
  );
}
