import Widget from "../../../../shared/ui/Widget";
import StatCard from "../../../../shared/ui/StatCard";

import {
  loadHousehold,
} from "../../../household/services/householdStorage";

import useSavings from "../../../savings/hooks/useSavings";

function formatCurrency(
  amount: number,
  currency: string
): string {
  return new Intl.NumberFormat(
    undefined,
    {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(amount);
}

export default function SavingsWidget() {
  const household =
    loadHousehold();

  const currency =
    household?.currency ??
    "PHP";

  const {
    summary,
  } = useSavings();

  const progressBarWidth =
    Math.min(
      Math.max(
        summary
          .overallProgressPercentage,
        0
      ),
      100
    );

  return (
    <Widget title="Savings Goals">
      <div className="space-y-4">
        <StatCard
          label="Total Saved"
          value={formatCurrency(
            summary.totalSaved,
            currency
          )}
          subtitle={`${summary.activeGoalCount} active goal${
            summary.activeGoalCount === 1
              ? ""
              : "s"
          }`}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-muted-foreground">
              Combined Target
            </p>

            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatCurrency(
                summary.totalTarget,
                currency
              )}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-muted-foreground">
              Remaining
            </p>

            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatCurrency(
                summary.remainingAmount,
                currency
              )}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">
              Overall Progress
            </span>

            <strong className="text-foreground">
              {new Intl.NumberFormat(
                undefined,
                {
                  maximumFractionDigits: 2,
                }
              ).format(
                summary
                  .overallProgressPercentage
              )}
              %
            </strong>
          </div>

          <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{
                width:
                  `${progressBarWidth}%`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4 text-sm">
          <span className="text-muted-foreground">
            Completed Goals
          </span>

          <strong className="text-foreground">
            {summary.completedGoalCount}
          </strong>
        </div>
      </div>
    </Widget>
  );
}