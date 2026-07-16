import {
  loadHousehold,
} from "../../household/services/householdStorage";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types";

import type {
  SavingsGoal,
} from "../models/SavingsGoal";

import type {
  SavingsGoalForm,
} from "../models/SavingsGoalForm";

import SavingsActivityRepository from "../repositories/SavingsActivityRepository";

import SavingsGoalRepository from "../repositories/SavingsGoalRepository";

import SavingsGoalValidator from "../validators/SavingsGoalValidator";

import SavingsProgressService from "./SavingsProgressService";

export default class SavingsGoalService {
  /**
   * Returns all savings goals for the active household.
   */
  static getSavingsGoals():
    SavingsGoal[] {
    const household =
      loadHousehold();

    if (!household) {
      return [];
    }

    return SavingsGoalRepository
      .findByHouseholdId(
        household.id
      )
      .sort(
        (
          firstGoal,
          secondGoal
        ) =>
          secondGoal.updatedAt.getTime() -
          firstGoal.updatedAt.getTime()
      );
  }

  /**
   * Returns one savings goal by ID when it belongs to the
   * active household.
   */
  static getSavingsGoalById(
    id: string
  ): SavingsGoal | undefined {
    const household =
      loadHousehold();

    if (!household) {
      return undefined;
    }

    const savingsGoal =
      SavingsGoalRepository.findById(
        id
      );

    if (
      !savingsGoal ||
      savingsGoal.householdId !==
        household.id
    ) {
      return undefined;
    }

    return savingsGoal;
  }

  /**
   * Returns active goals that are not completed or
   * archived.
   *
   * Paused goals remain active and visible.
   */
  static getActiveSavingsGoals():
    SavingsGoal[] {
    return this.getSavingsGoals()
      .filter(
        (goal) =>
          goal.isActive &&
          goal.status !==
            "completed" &&
          goal.status !==
            "archived"
      )
      .sort(
        (
          firstGoal,
          secondGoal
        ) =>
          this.compareGoals(
            firstGoal,
            secondGoal
          )
      );
  }

  /**
   * Returns goals considered complete either by status or
   * because active activity has reached the target.
   */
  static getCompletedSavingsGoals():
    SavingsGoal[] {
    return this.getSavingsGoals()
      .filter(
        (goal) => {
          if (
            goal.status ===
            "archived"
          ) {
            return false;
          }

          const progress =
            SavingsProgressService
              .getProgress(goal);

          return (
            goal.status ===
              "completed" ||
            progress.isCompleted
          );
        }
      )
      .sort(
        (
          firstGoal,
          secondGoal
        ) =>
          secondGoal.updatedAt.getTime() -
          firstGoal.updatedAt.getTime()
      );
  }

  /**
   * Returns archived savings goals.
   */
  static getArchivedSavingsGoals():
    SavingsGoal[] {
    return this.getSavingsGoals()
      .filter(
        (goal) =>
          goal.status ===
            "archived" ||
          !goal.isActive
      )
      .sort(
        (
          firstGoal,
          secondGoal
        ) =>
          secondGoal.updatedAt.getTime() -
          firstGoal.updatedAt.getTime()
      );
  }

  /**
   * Creates a new savings goal for the active household.
   */
  static create(
    form: SavingsGoalForm
  ): OperationResult<SavingsGoal> {
    const household =
      loadHousehold();

    if (!household) {
      return OperationResults.failure<
        SavingsGoal
      >(
        {
          householdId:
            "Complete household setup before creating savings goals.",
        },
        "Unable to create savings goal."
      );
    }

    const normalizedForm:
      SavingsGoalForm = {
        ...form,

        householdId:
          household.id,
      };

    const validation =
      SavingsGoalValidator.validate(
        normalizedForm,
        household.id
      );

    if (!validation.isValid) {
      return OperationResults.failure<
        SavingsGoal
      >(
        validation.errors,
        "Please correct the savings goal details."
      );
    }

    const duplicateName =
      this.getSavingsGoals()
        .some(
          (goal) =>
            goal.status !==
              "archived" &&
            goal.name
              .trim()
              .toLowerCase() ===
            normalizedForm.name
              .trim()
              .toLowerCase()
        );

    if (duplicateName) {
      return OperationResults.failure<
        SavingsGoal
      >(
        {
          name:
            "An active savings goal with this name already exists.",
        },
        "Unable to create savings goal."
      );
    }

    const now =
      new Date();

    const savingsGoal:
      SavingsGoal = {
        id:
          crypto.randomUUID(),

        householdId:
          household.id,

        name:
          normalizedForm.name.trim(),

        description:
          normalizedForm.description
            .trim() ||
          undefined,

        goalType:
          normalizedForm.goalType,

        targetAmount:
          this.roundCurrency(
            normalizedForm.targetAmount
          ),

        targetDate:
          normalizedForm.targetDate
            ? new Date(
                `${normalizedForm.targetDate}T00:00:00`
              )
            : undefined,

        linkedAccountId:
          normalizedForm.linkedAccountId
            .trim() ||
          undefined,

        priority:
          normalizedForm.priority,

        status:
          normalizedForm.status,

        isActive:
          normalizedForm.isActive,

        createdAt:
          now,

        updatedAt:
          now,
      };

    const createdGoal =
      SavingsGoalRepository.create(
        savingsGoal
      );

    if (!createdGoal) {
      return OperationResults.failure<
        SavingsGoal
      >(
        {
          general:
            "Savings goal could not be saved.",
        },
        "Unable to create savings goal."
      );
    }

    return OperationResults.success(
      createdGoal,
      "Savings goal created successfully."
    );
  }

  /**
   * Updates an existing savings goal.
   */
  static update(
    id: string,
    form: SavingsGoalForm
  ): OperationResult<SavingsGoal> {
    const household =
      loadHousehold();

    if (!household) {
      return OperationResults.failure<
        SavingsGoal
      >(
        {
          householdId:
            "Complete household setup before managing savings goals.",
        },
        "Unable to update savings goal."
      );
    }

    const existing =
      this.getSavingsGoalById(id);

    if (!existing) {
      return OperationResults.failure<
        SavingsGoal
      >(
        {
          general:
            "Savings goal was not found.",
        },
        "Unable to update savings goal."
      );
    }

    if (
      existing.householdId !==
      household.id
    ) {
      return OperationResults.failure<
        SavingsGoal
      >(
        {
          householdId:
            "Savings goal does not belong to the active household.",
        },
        "Unable to update savings goal."
      );
    }

    const normalizedForm:
      SavingsGoalForm = {
        ...form,

        householdId:
          existing.householdId,
      };

    const validation =
      SavingsGoalValidator.validate(
        normalizedForm,
        household.id
      );

    if (!validation.isValid) {
      return OperationResults.failure<
        SavingsGoal
      >(
        validation.errors,
        "Please correct the savings goal details."
      );
    }

    const duplicateName =
      this.getSavingsGoals()
        .some(
          (goal) =>
            goal.id !== id &&
            goal.status !==
              "archived" &&
            goal.name
              .trim()
              .toLowerCase() ===
            normalizedForm.name
              .trim()
              .toLowerCase()
        );

    if (duplicateName) {
      return OperationResults.failure<
        SavingsGoal
      >(
        {
          name:
            "An active savings goal with this name already exists.",
        },
        "Unable to update savings goal."
      );
    }

    const updatedGoal:
      SavingsGoal = {
        ...existing,

        householdId:
          existing.householdId,

        name:
          normalizedForm.name.trim(),

        description:
          normalizedForm.description
            .trim() ||
          undefined,

        goalType:
          normalizedForm.goalType,

        targetAmount:
          this.roundCurrency(
            normalizedForm.targetAmount
          ),

        targetDate:
          normalizedForm.targetDate
            ? new Date(
                `${normalizedForm.targetDate}T00:00:00`
              )
            : undefined,

        linkedAccountId:
          normalizedForm.linkedAccountId
            .trim() ||
          undefined,

        priority:
          normalizedForm.priority,

        status:
          normalizedForm.status,

        isActive:
          normalizedForm.status ===
            "archived"
            ? false
            : normalizedForm.isActive,

        updatedAt:
          new Date(),
      };

    const savedGoal =
      SavingsGoalRepository.update(
        updatedGoal
      );

    if (!savedGoal) {
      return OperationResults.failure<
        SavingsGoal
      >(
        {
          general:
            "Savings goal could not be saved.",
        },
        "Unable to update savings goal."
      );
    }

    return OperationResults.success(
      savedGoal,
      "Savings goal updated successfully."
    );
  }

  /**
   * Archives a savings goal while preserving its activity
   * history.
   */
  static archive(
    id: string
  ): OperationResult<SavingsGoal> {
    const existing =
      this.getSavingsGoalById(id);

    if (!existing) {
      return OperationResults.failure<
        SavingsGoal
      >(
        {
          general:
            "Savings goal was not found.",
        },
        "Unable to archive savings goal."
      );
    }

    if (
      existing.status ===
      "archived"
    ) {
      return OperationResults.success(
        existing,
        "Savings goal is already archived."
      );
    }

    const archivedGoal:
      SavingsGoal = {
        ...existing,

        status:
          "archived",

        isActive:
          false,

        updatedAt:
          new Date(),
      };

    const savedGoal =
      SavingsGoalRepository.update(
        archivedGoal
      );

    if (!savedGoal) {
      return OperationResults.failure<
        SavingsGoal
      >(
        {
          general:
            "Savings goal could not be archived.",
        },
        "Unable to archive savings goal."
      );
    }

    return OperationResults.success(
      savedGoal,
      "Savings goal archived successfully."
    );
  }

  /**
   * Deletes a savings goal only when it has no activity
   * history.
   *
   * Goals with history should be archived instead.
   */
  static delete(
    id: string
  ): OperationResult<boolean> {
    const savingsGoal =
      this.getSavingsGoalById(id);

    if (!savingsGoal) {
      return OperationResults.failure<
        boolean
      >(
        {
          general:
            "Savings goal was not found.",
        },
        "Unable to delete savings goal."
      );
    }

    const activities =
      SavingsActivityRepository
        .findBySavingsGoalId(id);

    if (activities.length > 0) {
      return OperationResults.failure<
        boolean
      >(
        {
          general:
            "Savings goals with activity history cannot be deleted. Archive the goal instead.",
        },
        "Unable to delete savings goal."
      );
    }

    const deleted =
      SavingsGoalRepository.delete(
        id
      );

    if (!deleted) {
      return OperationResults.failure<
        boolean
      >(
        {
          general:
            "Savings goal could not be deleted.",
        },
        "Unable to delete savings goal."
      );
    }

    return OperationResults.success(
      true,
      "Savings goal deleted successfully."
    );
  }

  /**
   * Sorts active goals by priority and then target date.
   */
  private static compareGoals(
    firstGoal: SavingsGoal,
    secondGoal: SavingsGoal
  ): number {
    const priorityOrder = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    } as const;

    const priorityDifference =
      priorityOrder[
        firstGoal.priority
      ] -
      priorityOrder[
        secondGoal.priority
      ];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const firstTargetTime =
      firstGoal.targetDate
        ?.getTime() ??
      Number.POSITIVE_INFINITY;

    const secondTargetTime =
      secondGoal.targetDate
        ?.getTime() ??
      Number.POSITIVE_INFINITY;

    if (
      firstTargetTime !==
      secondTargetTime
    ) {
      return (
        firstTargetTime -
        secondTargetTime
      );
    }

    return firstGoal.name.localeCompare(
      secondGoal.name
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
}