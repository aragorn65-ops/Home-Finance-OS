import Widget from "../../../../shared/ui/Widget";
import DashboardService from "../../services/DashboardService";

import "./HouseholdSummary.css";

interface SummaryItemProps {
  label: string;
  value: string;
}

function SummaryItem({
  label,
  value,
}: SummaryItemProps) {
  return (
    <div className="household-summary-item">
      <span className="household-summary-label">
        {label}
      </span>

      <strong className="household-summary-value">
        {value}
      </strong>
    </div>
  );
}

export default function HouseholdSummary() {
  const household =
    DashboardService.getHouseholdSummary();

  return (
    <Widget title="Household Summary">
      <div className="household-summary">
        <SummaryItem
          label="Household"
          value={household.householdName}
        />

        <SummaryItem
          label="Country"
          value={household.country}
        />

        <SummaryItem
          label="Currency"
          value={household.currency}
        />

        <SummaryItem
          label="Time Zone"
          value={household.timezone}
        />
      </div>
    </Widget>
  );
}