import "./SavingsSummary.css";

import formatCurrency from "../../../shared/utils/formatCurrency";

interface SavingsSummaryProps {
  totalSaved: number;
  totalTarget: number;
  remainingAmount: number;
  overallProgressPercentage: number;
  activeGoalCount: number;
  completedGoalCount: number;
  currency?: string;
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

  const progressLabel =
    formatPercentage(
      overallProgressPercentage
    );

  return (
    <section className="hfos-savings-summary">
      <div className="hfos-savings-summary__grid">
        <div className="hfos-savings-summary__card">
          <p className="hfos-savings-summary__label">
            Total Saved
          </p>

          <p className="hfos-savings-summary__value">
            {formatCurrency(
              totalSaved,
              currency
            )}
          </p>

          <p className="hfos-savings-summary__description">
            Reserved across active savings goals.
          </p>
        </div>

        <div className="hfos-savings-summary__card">
          <p className="hfos-savings-summary__label">
            Total Target
          </p>

          <p className="hfos-savings-summary__value">
            {formatCurrency(
              totalTarget,
              currency
            )}
          </p>

          <p className="hfos-savings-summary__description">
            Combined target for {activeGoalCount} active{" "}
            {activeGoalCount === 1
              ? "goal"
              : "goals"}
            .
          </p>
        </div>

        <div className="hfos-savings-summary__card">
          <p className="hfos-savings-summary__label">
            Remaining
          </p>

          <p className="hfos-savings-summary__value">
            {formatCurrency(
              remainingAmount,
              currency
            )}
          </p>

          <p className="hfos-savings-summary__description">
            Still needed to fund active goals.
          </p>
        </div>

        <div className="hfos-savings-summary__card">
          <p className="hfos-savings-summary__label">
            Completed Goals
          </p>

          <p className="hfos-savings-summary__value">
            {completedGoalCount}
          </p>

          <p className="hfos-savings-summary__description">
            Goals that reached or exceeded their target.
          </p>
        </div>
      </div>

      <div className="hfos-savings-summary__progress-card">
        <div className="hfos-savings-summary__progress-header">
          <div>
            <p className="hfos-savings-summary__label">
              Overall Progress
            </p>

            <p className="hfos-savings-summary__progress-value">
              {progressLabel}%
            </p>
          </div>

          {overallProgressPercentage > 100 && (
            <span className="hfos-savings-summary__status">
              Overfunded
            </span>
          )}
        </div>

        <div
          className="hfos-savings-summary__progress-track"
          role="progressbar"
          aria-label="Overall savings progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressBarWidth}
          aria-valuetext={`${progressLabel}%`}
        >
          <div
            className="hfos-savings-summary__progress-bar"
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
