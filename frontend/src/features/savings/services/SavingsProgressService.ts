import type {
  SavingsActivity,
} from "../models/SavingsActivity";

import type {
  SavingsGoal,
} from "../models/SavingsGoal";

import type {
  SavingsGoalProgress,
  SavingsGoalTimelineState,
} from "../models/SavingsGoalProgress";

import SavingsActivityRepository from "../repositories/SavingsActivityRepository";

const millisecondsPerDay =
  24 * 60 * 60 * 1000;

const averageDaysPerMonth =
  365.25 / 12;

export default class SavingsProgressService {
  /**
   * Calculates progress for one savings goal using its
   * active persisted activities.
   */
  static getProgress(
    savingsGoal: SavingsGoal,
    referenceDate = new Date()
  ): SavingsGoalProgress {
    const activities =
      SavingsActivityRepository
        .findBySavingsGoalId(
          savingsGoal.id
        );

    return this.calculateProgress(
      savingsGoal,
      activities,
      referenceDate
    );
  }

  /**
   * Calculates progress for multiple savings goals.
   */
  static getProgressForGoals(
    savingsGoals: SavingsGoal[],
    referenceDate = new Date()
  ): SavingsGoalProgress[] {
    const activities =
      SavingsActivityRepository
        .findAll();

    return savingsGoals.map(
      (goal) =>
        this.calculateProgress(
          goal,
          activities,
          referenceDate
        )
    );
  }

  /**
   * Calculates progress from an explicitly supplied
   * activity collection.
   *
   * This is useful when validating create, edit, or delete
   * operations before persistence.
   */
  static calculateProgress(
    savingsGoal: SavingsGoal,
    savingsActivities: SavingsActivity[],
    referenceDate = new Date()
  ): SavingsGoalProgress {
    const targetAmount =
      this.roundCurrency(
        savingsGoal.targetAmount
      );

    const savedAmount =
      this.calculateSavedAmount(
        savingsGoal,
        savingsActivities
      );

    const remainingAmount =
      this.roundCurrency(
        Math.max(
          targetAmount -
            savedAmount,
          0
        )
      );

    const progressPercentage =
      this.calculateProgressPercentage(
        targetAmount,
        savedAmount
      );

    const financiallyCompleted =
      targetAmount > 0 &&
      savedAmount >= targetAmount;

    const isCompleted =
      savingsGoal.status ===
        "completed" ||
      financiallyCompleted;

    const isOverfunded =
      targetAmount >= 0 &&
      savedAmount > targetAmount;

    const daysRemaining =
      savingsGoal.targetDate
        ? this.calculateDaysRemaining(
            savingsGoal.targetDate,
            referenceDate
          )
        : undefined;

    const isOverdue =
      !isCompleted &&
      daysRemaining !== undefined &&
      daysRemaining < 0;

    const timelineState =
      this.getTimelineState(
        savingsGoal.targetDate,
        daysRemaining,
        isCompleted
      );

    const requiredMonthlyContribution =
      this.calculateRequiredMonthlyContribution(
        remainingAmount,
        daysRemaining,
        isCompleted
      );

    return {
      savingsGoalId:
        savingsGoal.id,

      targetAmount,
      savedAmount,
      remainingAmount,

      progressPercentage,

      targetDate:
        savingsGoal.targetDate
          ? new Date(
              savingsGoal.targetDate
            )
          : undefined,

      daysRemaining,

      requiredMonthlyContribution,

      isCompleted,
      isOverfunded,
      isOverdue,

      timelineState,
    };
  }

  /**
   * Calculates the saved amount for one goal from active
   * activities belonging to the same household.
   */
  static calculateSavedAmount(
    savingsGoal: SavingsGoal,
    savingsActivities: SavingsActivity[]
  ): number {
    const total =
      savingsActivities
        .filter(
          (activity) =>
            activity.isActive &&
            activity.householdId ===
              savingsGoal.householdId &&
            activity.savingsGoalId ===
              savingsGoal.id
        )
        .reduce(
          (
            currentTotal,
            activity
          ) =>
            currentTotal +
            this.getActivityEffect(
              activity
            ),
          0
        );

    return this.roundCurrency(
      total
    );
  }

  /**
   * Returns the amount one activity adds to or removes
   * from a savings goal.
   */
  static getActivityEffect(
    savingsActivity: SavingsActivity
  ): number {
    if (
      savingsActivity.activityType ===
      "contribution"
    ) {
      return savingsActivity.amount;
    }

    if (
      savingsActivity.activityType ===
      "withdrawal"
    ) {
      return -savingsActivity.amount;
    }

    return savingsActivity.amount;
  }

  /**
   * Calculates percentage funded.
   *
   * A zero or negative target returns zero unless funds
   * have already been saved, in which case it returns
   * 100 to avoid division by zero.
   *
   * Overfunded goals may exceed 100 percent.
   */
  private static calculateProgressPercentage(
    targetAmount: number,
    savedAmount: number
  ): number {
    if (targetAmount <= 0) {
      return savedAmount > 0
        ? 100
        : 0;
    }

    return this.roundPercentage(
      (
        savedAmount /
        targetAmount
      ) * 100
    );
  }

  /**
   * Calculates whole calendar days between the reference
   * date and target date.
   */
  private static calculateDaysRemaining(
    targetDate: Date,
    referenceDate: Date
  ): number {
    const normalizedTargetDate =
      this.toUtcCalendarDate(
        targetDate
      );

    const normalizedReferenceDate =
      this.toUtcCalendarDate(
        referenceDate
      );

    return Math.round(
      (
        normalizedTargetDate -
        normalizedReferenceDate
      ) /
      millisecondsPerDay
    );
  }

  /**
   * Calculates the monthly amount needed to cover the
   * remaining goal balance.
   *
   * At least one month is used for future target dates
   * that are less than one month away.
   */
  private static calculateRequiredMonthlyContribution(
    remainingAmount: number,
    daysRemaining: number | undefined,
    isCompleted: boolean
  ): number | undefined {
    if (
      isCompleted ||
      remainingAmount <= 0 ||
      daysRemaining === undefined ||
      daysRemaining <= 0
    ) {
      return undefined;
    }

    const monthsRemaining =
      Math.max(
        daysRemaining /
          averageDaysPerMonth,
        1
      );

    return this.roundCurrency(
      remainingAmount /
      monthsRemaining
    );
  }

  /**
   * Determines the deadline state displayed by the UI.
   */
  private static getTimelineState(
    targetDate: Date | undefined,
    daysRemaining: number | undefined,
    isCompleted: boolean
  ): SavingsGoalTimelineState {
    if (isCompleted) {
      return "completed";
    }

    if (
      !targetDate ||
      daysRemaining === undefined
    ) {
      return "no-target-date";
    }

    if (daysRemaining < 0) {
      return "overdue";
    }

    if (daysRemaining === 0) {
      return "due-today";
    }

    return "upcoming";
  }

  /**
   * Converts a Date into a UTC calendar timestamp so
   * daylight-saving and time-of-day differences do not
   * distort whole-day calculations.
   */
  private static toUtcCalendarDate(
    value: Date
  ): number {
    return Date.UTC(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );
  }

  /**
   * Applies currency-level decimal precision.
   */
  private static roundCurrency(
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

  /**
   * Applies two-decimal precision to percentages.
   */
  private static roundPercentage(
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
}