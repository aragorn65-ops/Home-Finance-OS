import {
  useMemo,
  useState,
} from "react";

import type {
  SavingsActivity,
} from "../models/SavingsActivity";

import type {
  SavingsActivityForm,
} from "../models/SavingsActivityForm";

import type {
  SavingsGoal,
} from "../models/SavingsGoal";

import type {
  SavingsGoalForm,
} from "../models/SavingsGoalForm";

import type {
  SavingsGoalProgress,
} from "../models/SavingsGoalProgress";

import SavingsActivityService from "../services/SavingsActivityService";

import SavingsGoalService from "../services/SavingsGoalService";

import SavingsProgressService from "../services/SavingsProgressService";

export interface SavingsSummary {
  totalSaved: number;
  totalTarget: number;
  remainingAmount: number;
  overallProgressPercentage: number;
  activeGoalCount: number;
  completedGoalCount: number;
  nearestUpcomingGoal?: SavingsGoal;
}

export default function useSavings() {
  const loadGoals = (): SavingsGoal[] =>
    SavingsGoalService
      .getSavingsGoals();

  const loadActivities =
    (): SavingsActivity[] =>
      SavingsActivityService
        .getSavingsActivities();

  const [
    goals,
    setGoals,
  ] = useState<SavingsGoal[]>(
    loadGoals
  );

  const [
    activities,
    setActivities,
  ] = useState<SavingsActivity[]>(
    loadActivities
  );

  /**
   * Reloads goals and activities after a successful
   * savings operation.
   */
  const refresh = () => {
    setGoals(
      loadGoals()
    );

    setActivities(
      loadActivities()
    );
  };

  /**
   * Creates a savings goal and refreshes local state.
   */
  const createGoal = (
    form: SavingsGoalForm
  ) => {
    const result =
      SavingsGoalService.create(
        form
      );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Updates a savings goal and refreshes local state.
   */
  const updateGoal = (
    id: string,
    form: SavingsGoalForm
  ) => {
    const result =
      SavingsGoalService.update(
        id,
        form
      );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Archives a savings goal while preserving activity
   * history.
   */
  const archiveGoal = (
    id: string
  ) => {
    const result =
      SavingsGoalService.archive(
        id
      );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Permanently deletes a savings goal with no activity
   * history.
   */
  const removeGoal = (
    id: string
  ) => {
    const result =
      SavingsGoalService.delete(
        id
      );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Records a contribution, withdrawal, or adjustment.
   */
  const createActivity = (
    form: SavingsActivityForm
  ) => {
    const result =
      SavingsActivityService.create(
        form
      );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Updates an existing savings activity.
   */
  const updateActivity = (
    id: string,
    form: SavingsActivityForm
  ) => {
    const result =
      SavingsActivityService.update(
        id,
        form
      );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Deletes a savings activity and reverses its account
   * balance effect.
   */
  const removeActivity = (
    id: string
  ) => {
    const result =
      SavingsActivityService.delete(
        id
      );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Calculates progress using the hook's current activity
   * collection.
   */
  const progressByGoalId =
    useMemo(() => {
      return goals.reduce<
        Record<
          string,
          SavingsGoalProgress
        >
      >(
        (
          progressMap,
          goal
        ) => {
          progressMap[
            goal.id
          ] =
            SavingsProgressService
              .calculateProgress(
                goal,
                activities
              );

          return progressMap;
        },
        {}
      );
    }, [
      goals,
      activities,
    ]);

  /**
   * Active goals exclude archived, inactive, and
   * financially completed goals.
   */
  const activeGoals =
    useMemo(() => {
      return goals.filter(
        (goal) => {
          const progress =
            progressByGoalId[
              goal.id
            ];

          return (
            goal.isActive &&
            goal.status !==
              "archived" &&
            !progress?.isCompleted
          );
        }
      );
    }, [
      goals,
      progressByGoalId,
    ]);

  /**
   * Completed goals remain viewable even when their
   * explicit status has not yet been changed.
   */
  const completedGoals =
    useMemo(() => {
      return goals.filter(
        (goal) => {
          if (
            goal.status ===
              "archived" ||
            !goal.isActive
          ) {
            return false;
          }

          return Boolean(
            progressByGoalId[
              goal.id
            ]?.isCompleted
          );
        }
      );
    }, [
      goals,
      progressByGoalId,
    ]);

  /**
   * Archived and inactive goals remain available for
   * review outside the active goal list.
   */
  const archivedGoals =
    useMemo(() => {
      return goals.filter(
        (goal) =>
          goal.status ===
            "archived" ||
          !goal.isActive
      );
    }, [goals]);

  /**
   * Calculates the summary used by the Savings page and
   * dashboard widget.
   */
  const summary =
    useMemo<SavingsSummary>(() => {
      const totalSaved =
        roundCurrency(
          activeGoals.reduce(
            (
              total,
              goal
            ) =>
              total +
              (
                progressByGoalId[
                  goal.id
                ]?.savedBaseAmount ??
                0
              ),
            0
          )
        );

      const totalTarget =
        roundCurrency(
          activeGoals.reduce(
            (
              total,
              goal
            ) =>
              total +
              (
                progressByGoalId[
                  goal.id
                ]?.targetBaseAmount ??
                goal.targetBaseAmount ??
                goal.targetAmount
              ),
            0
          )
        );

      const remainingAmount =
        roundCurrency(
          Math.max(
            totalTarget -
              totalSaved,
            0
          )
        );

      const overallProgressPercentage =
        totalTarget > 0
          ? roundPercentage(
              (
                totalSaved /
                totalTarget
              ) * 100
            )
          : totalSaved > 0
            ? 100
            : 0;

      const nearestUpcomingGoal =
        [...activeGoals]
          .filter(
            (goal) => {
              const progress =
                progressByGoalId[
                  goal.id
                ];

              return (
                goal.targetDate !==
                  undefined &&
                progress !==
                  undefined &&
                progress.daysRemaining !==
                  undefined &&
                progress.daysRemaining >=
                  0
              );
            }
          )
          .sort(
            (
              firstGoal,
              secondGoal
            ) =>
              (
                firstGoal.targetDate
                  ?.getTime() ??
                Number.POSITIVE_INFINITY
              ) -
              (
                secondGoal.targetDate
                  ?.getTime() ??
                Number.POSITIVE_INFINITY
              )
          )[0];

      return {
        totalSaved,
        totalTarget,
        remainingAmount,
        overallProgressPercentage,

        activeGoalCount:
          activeGoals.length,

        completedGoalCount:
          completedGoals.length,

        nearestUpcomingGoal,
      };
    }, [
      activeGoals,
      completedGoals,
      progressByGoalId,
    ]);

  /**
   * Returns the activity history for one goal.
   */
  const getActivitiesForGoal = (
    savingsGoalId: string
  ): SavingsActivity[] => {
    return activities.filter(
      (activity) =>
        activity.savingsGoalId ===
        savingsGoalId
    );
  };

  return {
    goals,
    activeGoals,
    completedGoals,
    archivedGoals,

    activities,
    progressByGoalId,
    summary,

    getActivitiesForGoal,

    createGoal,
    updateGoal,
    archiveGoal,
    removeGoal,

    createActivity,
    updateActivity,
    removeActivity,

    refresh,
  };
}

function roundCurrency(
  amount: number
): number {
  return (
    Math.round(
      (
        amount +
        Number.EPSILON
      ) * 100
    ) /
    100
  );
}

function roundPercentage(
  percentage: number
): number {
  return (
    Math.round(
      (
        percentage +
        Number.EPSILON
      ) * 100
    ) /
    100
  );
}
