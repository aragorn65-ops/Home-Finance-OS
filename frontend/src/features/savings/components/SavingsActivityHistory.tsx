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

interface SavingsActivityHistoryProps {
  activities: SavingsActivity[];

  members: HouseholdMember[];
  accounts: Account[];

  currency?: string;

  onEdit?: (
    activity: SavingsActivity
  ) => void;

  onDelete?: (
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
  date: Date
): string {
  return new Intl.DateTimeFormat(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function formatActivityType(
  activityType:
    SavingsActivity["activityType"]
): string {
  return (
    activityType
      .charAt(0)
      .toUpperCase() +
    activityType.slice(1)
  );
}

function getActivityEffect(
  activity: SavingsActivity
): number {
  if (
    activity.activityType ===
    "contribution"
  ) {
    return activity.amount;
  }

  if (
    activity.activityType ===
    "withdrawal"
  ) {
    return -activity.amount;
  }

  return activity.amount;
}

export default function SavingsActivityHistory({
  activities,
  members,
  accounts,
  currency = "PHP",
  onEdit,
  onDelete,
}: SavingsActivityHistoryProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <h4 className="font-medium text-foreground">
          No savings activity recorded
        </h4>

        <p className="mt-2 text-sm text-muted-foreground">
          Contributions, withdrawals, and adjustments
          recorded for this goal will appear here.
        </p>
      </div>
    );
  }

  const sortedActivities = [
    ...activities,
  ].sort(
    (
      firstActivity,
      secondActivity
    ) => {
      const dateDifference =
        secondActivity.activityDate
          .getTime() -
        firstActivity.activityDate
          .getTime();

      if (dateDifference !== 0) {
        return dateDifference;
      }

      return (
        secondActivity.createdAt
          .getTime() -
        firstActivity.createdAt
          .getTime()
      );
    }
  );

  const getMemberName = (
    memberId: string
  ): string => {
    return (
      members.find(
        (member) =>
          member.id === memberId
      )?.displayName ??
      "Unknown Member"
    );
  };

  const getAccountName = (
    accountId?: string
  ): string => {
    if (!accountId) {
      return "No account effect";
    }

    return (
      accounts.find(
        (account) =>
          account.id === accountId
      )?.name ??
      "Unavailable Account"
    );
  };

  return (
    <div className="space-y-3">
      {sortedActivities.map(
        (activity) => {
          const activityEffect =
            getActivityEffect(
              activity
            );

          return (
            <article
              key={activity.id}
              className={[
                "rounded-lg border p-4",
                activity.isActive
                  ? "bg-white"
                  : "bg-muted/30 opacity-75",
              ].join(" ")}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-foreground">
                      {formatActivityType(
                        activity.activityType
                      )}
                    </h4>

                    {!activity.isActive && (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        Excluded from progress
                      </span>
                    )}
                  </div>

                  <p
                    className={[
                      "mt-1 text-lg font-semibold",
                      activityEffect >= 0
                        ? "text-emerald-700"
                        : "text-red-700",
                    ].join(" ")}
                  >
                    {activityEffect >= 0
                      ? "+"
                      : "−"}
                    {formatCurrency(
                      Math.abs(
                        activityEffect
                      ),
                      currency
                    )}
                  </p>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-muted-foreground">
                        Date:
                      </span>{" "}
                      <span className="font-medium text-foreground">
                        {formatDate(
                          activity.activityDate
                        )}
                      </span>
                    </p>

                    <p>
                      <span className="text-muted-foreground">
                        Member:
                      </span>{" "}
                      <span className="font-medium text-foreground">
                        {getMemberName(
                          activity.memberId
                        )}
                      </span>
                    </p>

                    <p>
                      <span className="text-muted-foreground">
                        Account:
                      </span>{" "}
                      <span className="font-medium text-foreground">
                        {getAccountName(
                          activity.accountId
                        )}
                      </span>
                    </p>

                    <p>
                      <span className="text-muted-foreground">
                        Updated:
                      </span>{" "}
                      <span className="font-medium text-foreground">
                        {formatDate(
                          activity.updatedAt
                        )}
                      </span>
                    </p>
                  </div>

                  {activity.notes && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {activity.notes}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  {onEdit && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        onEdit(
                          activity
                        )
                      }
                    >
                      Edit
                    </Button>
                  )}

                  {onDelete && (
                    <Button
                      variant="danger"
                      onClick={() =>
                        onDelete(
                          activity
                        )
                      }
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </article>
          );
        }
      )}
    </div>
  );
}