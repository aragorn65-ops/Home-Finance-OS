import Widget from "../../../../shared/ui/Widget";
import StatCard from "../../../../shared/ui/StatCard";

export default function NetWorth() {
  return (
    <Widget title="Net Worth">
      <StatCard
        label="Current Net Worth"
        value="₱245,000"
        subtitle="+4.2% this month"
      />
    </Widget>
  );
}