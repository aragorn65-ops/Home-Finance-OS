import {
  Button,
} from "../../../shared/ui";

import type {
  Account,
} from "../../accounts/models/Account";

import type {
  HouseholdMember,
} from "../../household/models/HouseholdMember";

import type {
  SavingsActivity,
} from "../models/SavingsActivity";

import type {
  SavingsGoal,
} from "../models/SavingsGoal";

import type {
  SavingsGoalProgress,
} from "../models/SavingsGoalProgress";

import SavingsActivityHistory from "./SavingsActivityHistory";

interface SavingsGoalDetailsProps {
  goal: SavingsGoal;
  progress: SavingsGoalProgress;
  activities: SavingsActivity[];

  members: HouseholdMember[];
  accounts: Account[];

  currency?: string;

  onClose: () => void;

  onRecordActivity?: (
    goal: SavingsGoal
  ) => void;

  onEditGoal?: (
    goal: SavingsGoal
  ) => void;

  onEditActivity?: (
    activity: SavingsActivity
  ) => void;

  onDeleteActivity?: (
    activity: SavingsActivity
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
    return "Not set";
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

function getTimelineDescription(
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

export default function SavingsGoalDetails({
  goal,
  progress,
  activities,
  members,
  accounts,
  currency = "PHP",
  onClose,
  onRecordActivity,
  onEditGoal,
  onEditActivity,
  onDeleteActivity,
}: SavingsGoalDetailsProps) {
  const linkedAccount =
    goal.linkedAccountId
      ? accounts.find(
          (account) =>
            account.id ===
            goal.linkedAccountId
        )
      : undefined;

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
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-foreground">
                {goal.name}
              </h3>

              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {formatLabel(
                  goal.goalType
                )}
              </span>

              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {formatLabel(
                  goal.priority
                )}
              </span>

              <span className="rounded-full border px-2.5 py-1 text-xs font-medium text-foreground">
                {formatLabel(
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
              <p className="mt-3 text-sm text-muted-foreground">
                {goal.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {onEditGoal && (
              <Button
                variant="secondary"
                onClick={() =>
                  onEditGoal(goal)
                }
              >
                Edit Goal
              </Button>
            )}

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
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Saved
            </p>

            <p className="mt-1 text-xl font-semibold text-foreground">
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

            <p className="mt-1 text-xl font-semibold text-foreground">
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

            <p className="mt-1 text-xl font-semibold text-foreground">
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

            <p className="mt-1 text-xl font-semibold text-foreground">
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

        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <p className="text-muted-foreground">
              Target Date
            </p>

            <p className="mt-1 font-medium text-foreground">
              {formatDate(
                progress.targetDate
              )}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">
              Timeline
            </p>

            <p className="mt-1 font-medium text-foreground">
              {getTimelineDescription(
                progress
              )}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">
              Required Monthly Contribution
            </p>

            <p className="mt-1 font-medium text-foreground">
              {progress
                .requiredMonthlyContribution !==
              undefined
                ? formatCurrency(
                    progress
                      .requiredMonthlyContribution,
                    currency
                  )
                : "Not applicable"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">
              Linked Account
            </p>

            <p className="mt-1 font-medium text-foreground">
              {linkedAccount
                ? linkedAccount.name
                : "No linked account"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">
              Created
            </p>

            <p className="mt-1 font-medium text-foreground">
              {formatDate(
                goal.createdAt
              )}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">
              Last Updated
            </p>

            <p className="mt-1 font-medium text-foreground">
              {formatDate(
                goal.updatedAt
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Activity History
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Contributions, withdrawals, and adjustments
            recorded against this goal.
          </p>
        </div>

        <SavingsActivityHistory
          activities={activities}
          members={members}
          accounts={accounts}
          currency={currency}
          onEdit={onEditActivity}
          onDelete={onDeleteActivity}
        />
      </section>

      <div className="flex justify-end">
        <Button
          variant="secondary"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}