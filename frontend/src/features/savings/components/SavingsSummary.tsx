interface SavingsSummaryProps {
  totalSaved: number;
  totalTarget: number;
  remainingAmount: number;
  overallProgressPercentage: number;
  activeGoalCount: number;
  completedGoalCount: number;
  currency?: string;
}

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

function formatPercentage(
  percentage: number
): string {
  return new Intl.NumberFormat(
    undefined,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(percentage);
}

export default function SavingsSummary({
  totalSaved,
  totalTarget,
  remainingAmount,
  overallProgressPercentage,
  activeGoalCount,
  completedGoalCount,
  currency = "PHP",
}: SavingsSummaryProps) {
  const progressBarWidth =
    Math.min(
      Math.max(
        overallProgressPercentage,
        0
      ),
      100
    );

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Total Saved
          </p>

          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(
              totalSaved,
              currency
            )}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Reserved across active savings goals.
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Total Target
          </p>

          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(
              totalTarget,
              currency
            )}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Combined target for {activeGoalCount} active{" "}
            {activeGoalCount === 1
              ? "goal"
              : "goals"}
            .
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Remaining
          </p>

          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(
              remainingAmount,
              currency
            )}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Still needed to fund active goals.
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Completed Goals
          </p>

          <p className="mt-2 text-2xl font-semibold text-foreground">
            {completedGoalCount}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Goals that reached or exceeded their target.
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Overall Progress
            </p>

            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatPercentage(
                overallProgressPercentage
              )}
              %
            </p>
          </div>

          {overallProgressPercentage > 100 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Overfunded
            </span>
          )}
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{
              width:
                `${progressBarWidth}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}