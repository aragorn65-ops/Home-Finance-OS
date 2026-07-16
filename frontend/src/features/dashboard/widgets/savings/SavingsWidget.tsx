import "./SavingsWidget.css";

import StatCard from "../../../../shared/ui/StatCard";
import Widget from "../../../../shared/ui/Widget";
import formatCurrency from "../../../../shared/utils/formatCurrency";

import {
  loadHousehold,
} from "../../../household/services/householdStorage";

import useSavings from "../../../savings/hooks/useSavings";

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
        summary.overallProgressPercentage,
        0
      ),
      100
    );

  const progressLabel =
    new Intl.NumberFormat(
      undefined,
      {
        maximumFractionDigits: 2,
      }
    ).format(
      summary.overallProgressPercentage
    );

  return (
    <Widget title="Savings Goals">
      <div className="hfos-savings-widget">
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

        <div className="hfos-savings-widget__metrics">
          <div className="hfos-savings-widget__metric">
            <p className="hfos-savings-widget__metric-label">
              Combined Target
            </p>

            <p className="hfos-savings-widget__metric-value">
              {formatCurrency(
                summary.totalTarget,
                currency
              )}
            </p>
          </div>

          <div className="hfos-savings-widget__metric">
            <p className="hfos-savings-widget__metric-label">
              Remaining
            </p>

            <p className="hfos-savings-widget__metric-value">
              {formatCurrency(
                summary.remainingAmount,
                currency
              )}
            </p>
          </div>
        </div>

        <div className="hfos-savings-widget__progress">
          <div className="hfos-savings-widget__progress-header">
            <span>
              Overall Progress
            </span>

            <strong className="hfos-savings-widget__progress-value">
              {progressLabel}%
            </strong>
          </div>

          <div
            className="hfos-savings-widget__progress-track"
            role="progressbar"
            aria-label="Overall savings progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressBarWidth}
          >
            <div
              className="hfos-savings-widget__progress-bar"
              style={{
                width:
                  `${progressBarWidth}%`,
              }}
            />
          </div>
        </div>

        <div className="hfos-savings-widget__footer">
          <span>
            Completed Goals
          </span>

          <strong className="hfos-savings-widget__footer-value">
            {summary.completedGoalCount}
          </strong>
        </div>
      </div>
    </Widget>
  );
}
