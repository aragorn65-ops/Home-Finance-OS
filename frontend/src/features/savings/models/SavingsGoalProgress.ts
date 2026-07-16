import type {
  SavingsGoal,
} from "./SavingsGoal";

export type SavingsGoalTimelineState =
  | "no-target-date"
  | "upcoming"
  | "due-today"
  | "overdue"
  | "completed";

export interface SavingsGoalProgress {
  savingsGoalId: SavingsGoal["id"];

  targetAmount: number;
  savedAmount: number;
  remainingAmount: number;

  /**
   * Percentage of the target currently funded.
   *
   * This may exceed 100 when a goal is overfunded.
   */
  progressPercentage: number;

  targetDate?: Date;

  /**
   * Whole calendar days remaining until the target date.
   *
   * Negative values indicate that the target date has
   * passed. This remains undefined when no target date
   * exists.
   */
  daysRemaining?: number;

  /**
   * Estimated monthly amount required to reach the target.
   *
   * This remains undefined when there is no future target
   * date, the goal is complete, or calculation is not
   * meaningful.
   */
  requiredMonthlyContribution?: number;

  isCompleted: boolean;
  isOverfunded: boolean;
  isOverdue: boolean;

  timelineState: SavingsGoalTimelineState;
}