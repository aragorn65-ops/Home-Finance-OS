import "./SavingsGoalCard.css";

import {
  Button,
} from "../../../shared/ui";

import formatCurrency from "../../../shared/utils/formatCurrency";

import type {
  SavingsGoal,
} from "../models/SavingsGoal";

import type {
  SavingsGoalProgress,
} from "../models/SavingsGoalProgress";

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  progress: SavingsGoalProgress;
  currency?: string;

  onView: (
    goal: SavingsGoal
  ) => void;

  onRecordActivity?: (
    goal: SavingsGoal
  ) => void;

  onEdit?: (
    goal: SavingsGoal
  ) => void;

  onArchive?: (
    goal: SavingsGoal
  ) => void;

  onDelete?: (
    goal: SavingsGoal
  ) => void;
}

function formatDate(
  date?: Date
): string {
  if (!date) {
    return "No target date";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function formatLabel(
  value: string
): string {
  return value
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getTimelineLabel(
  progress: SavingsGoalProgress
): string {
  if (
    progress.timelineState ===
    "completed"
  ) {
    return "Goal completed";
  }

  if (
    progress.timelineState ===
    "no-target-date"
  ) {
    return "No target date";
  }

  if (
    progress.timelineState ===
    "due-today"
  ) {
    return "Due today";
  }

  if (
    progress.timelineState ===
    "overdue"
  ) {
    return `${Math.abs(
      progress.daysRemaining ?? 0
    )} days overdue`;
  }

  return `${progress.daysRemaining ?? 0} days remaining`;
}

export default function SavingsGoalCard({
  goal,
  progress,
  currency = "PHP",
  onView,
  onRecordActivity,
  onEdit,
  onArchive,
  onDelete,
}: SavingsGoalCardProps) {
  const goalCurrency =
    goal.goalCurrency || currency;

  const progressBarWidth =
    Math.min(
      Math.max(
        progress.progressPercentage,
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
      progress.progressPercentage
    );

  const mayRecordActivity =
    goal.isActive &&
    goal.status !==
      "archived";

  return (
    <article className="hfos-savings-goal-card">
      <div className="hfos-savings-goal-card__header">
        <div className="hfos-savings-goal-card__content">
          <div className="hfos-savings-goal-card__title-row">
            <h3 className="hfos-savings-goal-card__title">
              {goal.name}
            </h3>

            <span className="hfos-savings-goal-card__badge hfos-savings-goal-card__badge--neutral">
              {formatLabel(
                goal.goalType
              )}
            </span>

            <span className="hfos-savings-goal-card__badge hfos-savings-goal-card__badge--info">
              {formatLabel(
                goal.priority
              )}
            </span>

            <span className="hfos-savings-goal-card__badge hfos-savings-goal-card__badge--neutral">
              {formatLabel(
                goal.status
              )}
            </span>

            {progress.isOverfunded && (
              <span className="hfos-savings-goal-card__badge hfos-savings-goal-card__badge--success">
                Overfunded
              </span>
            )}

            {progress.isOverdue && (
              <span className="hfos-savings-goal-card__badge hfos-savings-goal-card__badge--warning">
                Overdue
              </span>
            )}
          </div>

          {goal.description && (
            <p className="hfos-savings-goal-card__description">
              {goal.description}
            </p>
          )}
        </div>

        <div className="hfos-savings-goal-card__actions">
          <Button
            variant="secondary"
            onClick={() =>
              onView(goal)
            }
          >
            View
          </Button>

          {onRecordActivity &&
            mayRecordActivity && (
              <Button
                variant="primary"
                onClick={() =>
                  onRecordActivity(
                    goal
                  )
                }
              >
                Add Activity
              </Button>
            )}

          {onEdit && (
            <Button
              variant="secondary"
              onClick={() =>
                onEdit(goal)
              }
            >
              Edit
            </Button>
          )}

          {onArchive &&
            goal.status !==
              "archived" && (
              <Button
                variant="secondary"
                onClick={() =>
                  onArchive(goal)
                }
              >
                Archive
              </Button>
            )}

          {onDelete && (
            <Button
              variant="danger"
              onClick={() =>
                onDelete(goal)
              }
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="hfos-savings-goal-card__metrics">
        <div className="hfos-savings-goal-card__metric">
          <p className="hfos-savings-goal-card__metric-label">
            Saved
          </p>

          <p className="hfos-savings-goal-card__metric-value">
            {formatCurrency(
              progress.savedAmount,
              goalCurrency
            )}
          </p>
        </div>

        <div className="hfos-savings-goal-card__metric">
          <p className="hfos-savings-goal-card__metric-label">
            Target
          </p>

          <p className="hfos-savings-goal-card__metric-value">
            {formatCurrency(
              progress.targetAmount,
              goalCurrency
            )}
          </p>
        </div>

        <div className="hfos-savings-goal-card__metric">
          <p className="hfos-savings-goal-card__metric-label">
            Remaining
          </p>

          <p className="hfos-savings-goal-card__metric-value">
            {formatCurrency(
              progress.remainingAmount,
              goalCurrency
            )}
          </p>
        </div>

        <div className="hfos-savings-goal-card__metric">
          <p className="hfos-savings-goal-card__metric-label">
            Progress
          </p>

          <p className="hfos-savings-goal-card__metric-value">
            {progressLabel}%
          </p>
        </div>
      </div>

      <div
        className="hfos-savings-goal-card__progress-track"
        role="progressbar"
        aria-label={`Progress for ${goal.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressBarWidth}
        aria-valuetext={`${progressLabel}%`}
      >
        <div
          className="hfos-savings-goal-card__progress-bar"
          style={{
            width:
              `${progressBarWidth}%`,
          }}
        />
      </div>

      <div className="hfos-savings-goal-card__details">
        <div className="hfos-savings-goal-card__detail">
          <span>
            Target date:
          </span>{" "}

          <span className="hfos-savings-goal-card__detail-value">
            {formatDate(
              progress.targetDate
            )}
          </span>
        </div>

        <div className="hfos-savings-goal-card__detail">
          <span>
            Timeline:
          </span>{" "}

          <span className="hfos-savings-goal-card__detail-value">
            {getTimelineLabel(
              progress
            )}
          </span>
        </div>

        <div className="hfos-savings-goal-card__detail">
          <span>
            Monthly needed:
          </span>{" "}

          <span className="hfos-savings-goal-card__detail-value">
            {progress
              .requiredMonthlyContribution !==
            undefined
              ? formatCurrency(
                  progress
                    .requiredMonthlyContribution,
                  goalCurrency
                )
              : "Not applicable"}
          </span>
        </div>

        <div className="hfos-savings-goal-card__detail">
          <span>
            Base equivalent:
          </span>{" "}

          <span className="hfos-savings-goal-card__detail-value">
            {formatCurrency(
              progress.savedBaseAmount,
              goal.baseCurrency ||
                currency
            )}
          </span>
        </div>

        <div className="hfos-savings-goal-card__detail">
          <span>
            Last updated:
          </span>{" "}

          <span className="hfos-savings-goal-card__detail-value">
            {formatDate(
              goal.updatedAt
            )}
          </span>
        </div>
      </div>
    </article>
  );
}
