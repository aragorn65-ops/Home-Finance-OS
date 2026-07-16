import AccountService from "../../accounts/services/AccountService";

import {
  loadHousehold,
} from "../../household/services/householdStorage";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types";

import type {
  SavingsActivity,
} from "../models/SavingsActivity";

import type {
  SavingsActivityForm,
} from "../models/SavingsActivityForm";

import SavingsActivityRepository from "../repositories/SavingsActivityRepository";

import SavingsGoalRepository from "../repositories/SavingsGoalRepository";

import SavingsActivityValidator from "../validators/SavingsActivityValidator";

import SavingsProgressService from "./SavingsProgressService";

type AccountOperationType =
  | "debit"
  | "credit";

interface AccountOperation {
  accountId: string;
  type: AccountOperationType;
  amount: number;

  /**
   * Historical operations may update inactive accounts.
   *
   * They are used when reversing or restoring an already
   * persisted savings activity.
   */
  isHistorical: boolean;
}

export default class SavingsActivityService {
  /**
   * Returns all savings activities belonging to the
   * active household.
   */
  static getSavingsActivities():
    SavingsActivity[] {
    const household =
      loadHousehold();

    if (!household) {
      return [];
    }

    return SavingsActivityRepository
      .findByHouseholdId(
        household.id
      )
      .sort(
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
  }

  /**
   * Returns one savings activity when it belongs to the
   * active household.
   */
  static getSavingsActivityById(
    id: string
  ): SavingsActivity | undefined {
    const household =
      loadHousehold();

    if (!household) {
      return undefined;
    }

    const activity =
      SavingsActivityRepository.findById(
        id
      );

    if (
      !activity ||
      activity.householdId !==
        household.id
    ) {
      return undefined;
    }

    return activity;
  }

  /**
   * Returns savings activity for one goal in reverse
   * chronological order.
   */
  static getActivitiesBySavingsGoalId(
    savingsGoalId: string
  ): SavingsActivity[] {
    const household =
      loadHousehold();

    if (!household) {
      return [];
    }

    const savingsGoal =
      SavingsGoalRepository.findById(
        savingsGoalId
      );

    if (
      !savingsGoal ||
      savingsGoal.householdId !==
        household.id
    ) {
      return [];
    }

    return SavingsActivityRepository
      .findBySavingsGoalId(
        savingsGoalId
      )
      .filter(
        (activity) =>
          activity.householdId ===
          household.id
      )
      .sort(
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
  }

  /**
   * Creates and persists a new savings activity.
   */
  static create(
    form: SavingsActivityForm
  ): OperationResult<SavingsActivity> {
    const household =
      loadHousehold();

    if (!household) {
      return OperationResults.failure<
        SavingsActivity
      >(
        {
          householdId:
            "Complete household setup before recording savings activity.",
        },
        "Unable to record savings activity."
      );
    }

    const normalizedForm =
      this.normalizeForm(
        form,
        household.id
      );

    const savingsGoal =
      SavingsGoalRepository.findById(
        normalizedForm.savingsGoalId
      );

    const savedAmountBeforeActivity =
      savingsGoal
        ? this.getCurrentSavedAmount(
            savingsGoal.id
          )
        : 0;

    const validation =
      SavingsActivityValidator.validate(
        normalizedForm,
        {
          activeHouseholdId:
            household.id,

          savedAmountBeforeActivity,
        }
      );

    if (!validation.isValid) {
      return OperationResults.failure<
        SavingsActivity
      >(
        validation.errors,
        "Please correct the savings activity details."
      );
    }

    const now =
      new Date();

    const activity:
      SavingsActivity = {
        id:
          crypto.randomUUID(),

        householdId:
          household.id,

        savingsGoalId:
          normalizedForm
            .savingsGoalId,

        memberId:
          normalizedForm.memberId,

        activityType:
          normalizedForm.activityType,

        amount:
          normalizedForm.amount,

        activityDate:
          new Date(
            `${normalizedForm.activityDate}T00:00:00`
          ),

        accountId:
          normalizedForm.accountId ||
          undefined,

        notes:
          normalizedForm.notes ||
          undefined,

        isActive:
          normalizedForm.isActive,

        createdAt:
          now,

        updatedAt:
          now,
      };

    const accountOperations =
      this.buildApplyAccountOperations(
        activity
      );

    const accountResult =
      this.executeAccountOperations(
        accountOperations
      );

    if (!accountResult.success) {
      return OperationResults.failure<
        SavingsActivity
      >(
        accountResult.errors,
        accountResult.message ??
          "Unable to update the savings account balance."
      );
    }

    const createdActivity =
      SavingsActivityRepository.create(
        activity
      );

    if (!createdActivity) {
      const rollbackResult =
        this.rollbackAccountOperations(
          accountOperations
        );

      if (!rollbackResult.success) {
        return OperationResults.failure<
          SavingsActivity
        >(
          {
            general:
              "Savings activity could not be saved and its account effect could not be fully rolled back.",
          },
          "Critical savings activity rollback failure."
        );
      }

      return OperationResults.failure<
        SavingsActivity
      >(
        {
          general:
            "Savings activity could not be saved.",
        },
        "Unable to record savings activity."
      );
    }

    return OperationResults.success(
      createdActivity,
      "Savings activity recorded successfully."
    );
  }

  /**
   * Updates an existing savings activity.
   *
   * The original account effect is reversed before the
   * replacement effect is applied.
   */
  static update(
    id: string,
    form: SavingsActivityForm
  ): OperationResult<SavingsActivity> {
    const household =
      loadHousehold();

    if (!household) {
      return OperationResults.failure<
        SavingsActivity
      >(
        {
          householdId:
            "Complete household setup before managing savings activity.",
        },
        "Unable to update savings activity."
      );
    }

    const existing =
      this.getSavingsActivityById(id);

    if (!existing) {
      return OperationResults.failure<
        SavingsActivity
      >(
        {
          general:
            "Savings activity was not found.",
        },
        "Unable to update savings activity."
      );
    }

    const existingGoal =
      SavingsGoalRepository.findById(
        existing.savingsGoalId
      );

    if (
      !existingGoal ||
      existingGoal.householdId !==
        household.id
    ) {
      return OperationResults.failure<
        SavingsActivity
      >(
        {
          savingsGoalId:
            "The original savings goal was not found.",
        },
        "Unable to update savings activity."
      );
    }

    const normalizedForm =
      this.normalizeForm(
        form,
        existing.householdId
      );

    const originalGoalBalance =
      this.getCurrentSavedAmount(
        existing.savingsGoalId
      );

    const originalEffect =
      existing.isActive
        ? SavingsProgressService
            .getActivityEffect(
              existing
            )
        : 0;

    const originalGoalBalanceAfterRemoval =
      this.roundCurrency(
        originalGoalBalance -
        originalEffect
      );

    if (
      originalGoalBalanceAfterRemoval <
      0
    ) {
      return OperationResults.failure<
        SavingsActivity
      >(
        {
          amount:
            "This activity cannot be changed because later activity depends on its saved amount.",
        },
        "Unable to update savings activity."
      );
    }

    const replacementGoal =
      SavingsGoalRepository.findById(
        normalizedForm.savingsGoalId
      );

    const savedAmountBeforeReplacement =
      replacementGoal
        ? replacementGoal.id ===
          existing.savingsGoalId
          ? originalGoalBalanceAfterRemoval
          : this.getCurrentSavedAmount(
              replacementGoal.id
            )
        : 0;

    const availableAccountBalance =
      this.getAvailableBalanceAfterVirtualReversal(
        existing,
        normalizedForm.accountId
      );

    const validation =
      SavingsActivityValidator.validate(
        normalizedForm,
        {
          activeHouseholdId:
            household.id,

          savedAmountBeforeActivity:
            savedAmountBeforeReplacement,

          availableAccountBalance,
        }
      );

    if (!validation.isValid) {
      return OperationResults.failure<
        SavingsActivity
      >(
        validation.errors,
        "Please correct the savings activity details."
      );
    }

    const updatedActivity:
      SavingsActivity = {
        ...existing,

        householdId:
          existing.householdId,

        savingsGoalId:
          normalizedForm
            .savingsGoalId,

        memberId:
          normalizedForm.memberId,

        activityType:
          normalizedForm.activityType,

        amount:
          normalizedForm.amount,

        activityDate:
          new Date(
            `${normalizedForm.activityDate}T00:00:00`
          ),

        accountId:
          normalizedForm.accountId ||
          undefined,

        notes:
          normalizedForm.notes ||
          undefined,

        isActive:
          normalizedForm.isActive,

        updatedAt:
          new Date(),
      };

    const accountOperations = [
      ...this.buildReverseAccountOperations(
        existing
      ),

      ...this.buildApplyAccountOperations(
        updatedActivity
      ),
    ];

    const accountResult =
      this.executeAccountOperations(
        accountOperations
      );

    if (!accountResult.success) {
      return OperationResults.failure<
        SavingsActivity
      >(
        accountResult.errors,
        accountResult.message ??
          "Unable to update the savings account balance."
      );
    }

    const savedActivity =
      SavingsActivityRepository.update(
        updatedActivity
      );

    if (!savedActivity) {
      const rollbackResult =
        this.rollbackAccountOperations(
          accountOperations
        );

      if (!rollbackResult.success) {
        return OperationResults.failure<
          SavingsActivity
        >(
          {
            general:
              "Savings activity could not be saved and its account changes could not be fully rolled back.",
          },
          "Critical savings activity rollback failure."
        );
      }

      return OperationResults.failure<
        SavingsActivity
      >(
        {
          general:
            "Savings activity could not be saved.",
        },
        "Unable to update savings activity."
      );
    }

    return OperationResults.success(
      savedActivity,
      "Savings activity updated successfully."
    );
  }

  /**
   * Deletes a savings activity and reverses its account
   * effect.
   */
  static delete(
    id: string
  ): OperationResult<boolean> {
    const existing =
      this.getSavingsActivityById(id);

    if (!existing) {
      return OperationResults.failure<
        boolean
      >(
        {
          general:
            "Savings activity was not found.",
        },
        "Unable to delete savings activity."
      );
    }

    const savingsGoal =
      SavingsGoalRepository.findById(
        existing.savingsGoalId
      );

    if (!savingsGoal) {
      return OperationResults.failure<
        boolean
      >(
        {
          savingsGoalId:
            "Savings goal was not found.",
        },
        "Unable to delete savings activity."
      );
    }

    const currentSavedAmount =
      this.getCurrentSavedAmount(
        existing.savingsGoalId
      );

    const existingEffect =
      existing.isActive
        ? SavingsProgressService
            .getActivityEffect(
              existing
            )
        : 0;

    const savedAmountAfterDeletion =
      this.roundCurrency(
        currentSavedAmount -
        existingEffect
      );

    if (savedAmountAfterDeletion < 0) {
      return OperationResults.failure<
        boolean
      >(
        {
          amount:
            "This activity cannot be deleted because later activity depends on its saved amount.",
        },
        "Unable to delete savings activity."
      );
    }

    const accountOperations =
      this.buildReverseAccountOperations(
        existing
      );

    const accountResult =
      this.executeAccountOperations(
        accountOperations
      );

    if (!accountResult.success) {
      return OperationResults.failure<
        boolean
      >(
        accountResult.errors,
        accountResult.message ??
          "Unable to reverse the savings account balance."
      );
    }

    const deleted =
      SavingsActivityRepository.delete(
        id
      );

    if (!deleted) {
      const rollbackResult =
        this.rollbackAccountOperations(
          accountOperations
        );

      if (!rollbackResult.success) {
        return OperationResults.failure<
          boolean
        >(
          {
            general:
              "Savings activity could not be deleted and its original account effect could not be restored.",
          },
          "Critical savings activity rollback failure."
        );
      }

      return OperationResults.failure<
        boolean
      >(
        {
          general:
            "Savings activity could not be deleted.",
        },
        "Unable to delete savings activity."
      );
    }

    return OperationResults.success(
      true,
      "Savings activity deleted successfully."
    );
  }

  /**
   * Normalizes form values before validation.
   */
  private static normalizeForm(
    form: SavingsActivityForm,
    householdId: string
  ): SavingsActivityForm {
    return {
      ...form,

      householdId,

      savingsGoalId:
        form.savingsGoalId.trim(),

      memberId:
        form.memberId.trim(),

      amount:
        this.roundCurrency(
          form.amount
        ),

      activityDate:
        form.activityDate.trim(),

      accountId:
        form.accountId.trim(),

      notes:
        form.notes.trim(),
    };
  }

  /**
   * Calculates one goal's current saved amount from its
   * active activity collection.
   */
  private static getCurrentSavedAmount(
    savingsGoalId: string
  ): number {
    const savingsGoal =
      SavingsGoalRepository.findById(
        savingsGoalId
      );

    if (!savingsGoal) {
      return 0;
    }

    const activities =
      SavingsActivityRepository
        .findBySavingsGoalId(
          savingsGoalId
        );

    return SavingsProgressService
      .calculateSavedAmount(
        savingsGoal,
        activities
      );
  }

  /**
   * Returns the selected account balance after virtually
   * reversing the original activity.
   *
   * This lets validation check the replacement activity
   * before changing persisted account balances.
   */
  private static getAvailableBalanceAfterVirtualReversal(
    existing: SavingsActivity,
    replacementAccountId: string
  ): number | undefined {
    if (
      !existing.isActive ||
      !existing.accountId ||
      existing.accountId !==
        replacementAccountId
    ) {
      return undefined;
    }

    const account =
      AccountService.getAccountById(
        existing.accountId
      );

    if (!account) {
      return undefined;
    }

    const originalGoalEffect =
      SavingsProgressService
        .getActivityEffect(
          existing
        );

    return this.roundCurrency(
      account.currentBalance +
      originalGoalEffect
    );
  }

  /**
   * Builds the account operation that applies an active
   * savings activity.
   */
  private static buildApplyAccountOperations(
    activity: SavingsActivity
  ): AccountOperation[] {
    if (
      !activity.isActive ||
      !activity.accountId
    ) {
      return [];
    }

    const goalEffect =
      SavingsProgressService
        .getActivityEffect(
          activity
        );

    if (goalEffect === 0) {
      return [];
    }

    return [
      {
        accountId:
          activity.accountId,

        type:
          goalEffect > 0
            ? "credit"
            : "debit",

        amount:
          Math.abs(
            goalEffect
          ),

        isHistorical:
          false,
      },
    ];
  }

  /**
   * Builds the historical inverse operation for an
   * existing active savings activity.
   */
  private static buildReverseAccountOperations(
    activity: SavingsActivity
  ): AccountOperation[] {
    if (
      !activity.isActive ||
      !activity.accountId
    ) {
      return [];
    }

    const goalEffect =
      SavingsProgressService
        .getActivityEffect(
          activity
        );

    if (goalEffect === 0) {
      return [];
    }

    return [
      {
        accountId:
          activity.accountId,

        type:
          goalEffect > 0
            ? "debit"
            : "credit",

        amount:
          Math.abs(
            goalEffect
          ),

        isHistorical:
          true,
      },
    ];
  }

  /**
   * Executes account operations sequentially.
   *
   * Completed operations are rolled back automatically
   * when a later operation fails.
   */
  private static executeAccountOperations(
    operations: AccountOperation[]
  ): OperationResult<boolean> {
    const completedOperations:
      AccountOperation[] = [];

    for (
      const operation of
      operations
    ) {
      const result =
        this.executeAccountOperation(
          operation
        );

      if (!result.success) {
        const rollbackResult =
          this.rollbackAccountOperations(
            completedOperations
          );

        if (!rollbackResult.success) {
          return OperationResults.failure<
            boolean
          >(
            {
              general:
                "Savings account changes failed and completed operations could not be fully rolled back.",
            },
            "Critical savings account rollback failure."
          );
        }

        return OperationResults.failure<
          boolean
        >(
          result.errors,
          result.message ??
            "Unable to update a savings account balance."
        );
      }

      completedOperations.push(
        operation
      );
    }

    return OperationResults.success(
      true
    );
  }

  /**
   * Executes one normal or historical account operation.
   */
  private static executeAccountOperation(
    operation: AccountOperation
  ) {
    if (
      operation.type ===
      "debit"
    ) {
      return operation.isHistorical
        ? AccountService
            .debitAccountForHistoricalAdjustment(
              operation.accountId,
              operation.amount
            )
        : AccountService
            .debitAccount(
              operation.accountId,
              operation.amount
            );
    }

    return operation.isHistorical
      ? AccountService
          .creditAccountForHistoricalAdjustment(
            operation.accountId,
            operation.amount
          )
      : AccountService
          .creditAccount(
            operation.accountId,
            operation.amount
          );
  }

  /**
   * Reverses completed operations in reverse order.
   *
   * Rollback always uses historical adjustment methods so
   * an account becoming inactive does not prevent
   * restoration.
   */
  private static rollbackAccountOperations(
    completedOperations:
      AccountOperation[]
  ): OperationResult<boolean> {
    const reversedOperations = [
      ...completedOperations,
    ].reverse();

    for (
      const operation of
      reversedOperations
    ) {
      const inverseOperation:
        AccountOperation = {
          ...operation,

          type:
            operation.type ===
            "debit"
              ? "credit"
              : "debit",

          isHistorical:
            true,
        };

      const result =
        this.executeAccountOperation(
          inverseOperation
        );

      if (!result.success) {
        return OperationResults.failure<
          boolean
        >(
          result.errors,
          result.message ??
            "Unable to restore an account balance."
        );
      }
    }

    return OperationResults.success(
      true
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