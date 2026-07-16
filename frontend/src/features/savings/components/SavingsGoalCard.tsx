import {
  Button,
} from "../../../shared/ui";

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

function formatGoalType(
  goalType: SavingsGoal["goalType"]
): string {
  return goalType
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatStatus(
  status: SavingsGoal["status"]
): string {
  return status
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatPriority(
  priority: SavingsGoal["priority"]
): string {
  return (
    priority.charAt(0).toUpperCase() +
    priority.slice(1)
  );
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
  const progressBarWidth =
    Math.min(
      Math.max(
        progress.progressPercentage,
        0
      ),
      100
    );

  const mayRecordActivity =
    goal.isActive &&
    goal.status !==
      "archived";

  return (
    <article className="rounded-lg border bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              {goal.name}
            </h3>

            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {formatGoalType(
                goal.goalType
              )}
            </span>

            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {formatPriority(
                goal.priority
              )}
            </span>

            <span className="rounded-full border px-2.5 py-1 text-xs font-medium text-foreground">
              {formatStatus(
                goal.status
              )}
            </span>

            {progress.isOverfunded && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                Overfunded
              </span>
            )}

            {progress.isOverdue && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                Overdue
              </span>
            )}
          </div>

          {goal.description && (
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {goal.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
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

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Saved
          </p>

          <p className="mt-1 text-lg font-semibold text-foreground">
            {formatCurrency(
              progress.savedAmount,
              currency
            )}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Target
          </p>

          <p className="mt-1 text-lg font-semibold text-foreground">
            {formatCurrency(
              progress.targetAmount,
              currency
            )}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Remaining
          </p>

          <p className="mt-1 text-lg font-semibold text-foreground">
            {formatCurrency(
              progress.remainingAmount,
              currency
            )}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Progress
          </p>

          <p className="mt-1 text-lg font-semibold text-foreground">
            {new Intl.NumberFormat(
              undefined,
              {
                maximumFractionDigits: 2,
              }
            ).format(
              progress.progressPercentage
            )}
            %
          </p>
        </div>
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

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <span className="text-muted-foreground">
            Target date:
          </span>{" "}
          <span className="font-medium text-foreground">
            {formatDate(
              progress.targetDate
            )}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground">
            Timeline:
          </span>{" "}
          <span className="font-medium text-foreground">
            {getTimelineLabel(
              progress
            )}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground">
            Monthly needed:
          </span>{" "}
          <span className="font-medium text-foreground">
            {progress
              .requiredMonthlyContribution !==
            undefined
              ? formatCurrency(
                  progress
                    .requiredMonthlyContribution,
                  currency
                )
              : "Not applicable"}
          </span>
        </div>

        <div>
          <span className="text-muted-foreground">
            Last updated:
          </span>{" "}
          <span className="font-medium text-foreground">
            {formatDate(
              goal.updatedAt
            )}
          </span>
        </div>
      </div>
    </article>
  );
}