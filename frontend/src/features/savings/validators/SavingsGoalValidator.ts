import AccountService from "../../accounts/services/AccountService";

import type {
  SavingsGoalPriority,
  SavingsGoalStatus,
  SavingsGoalType,
} from "../models/SavingsGoal";

import type {
  SavingsGoalForm,
} from "../models/SavingsGoalForm";

export interface SavingsGoalValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const savingsGoalTypes:
  SavingsGoalType[] = [
    "emergency-fund",
    "vacation",
    "annual-insurance",
    "home-repair",
    "tuition",
    "vehicle-maintenance",
    "appliance-replacement",
    "general",
    "other",
  ];

const savingsGoalPriorities:
  SavingsGoalPriority[] = [
    "low",
    "medium",
    "high",
    "critical",
  ];

const savingsGoalStatuses:
  SavingsGoalStatus[] = [
    "not-started",
    "in-progress",
    "completed",
    "paused",
    "archived",
  ];

export default class SavingsGoalValidator {
  /**
   * Validates savings-goal form data before persistence.
   */
  static validate(
    form: SavingsGoalForm,
    activeHouseholdId: string
  ): SavingsGoalValidationResult {
    const errors:
      Record<string, string> = {};

    if (!activeHouseholdId.trim()) {
      errors.householdId =
        "Complete household setup before managing savings goals.";
    } else if (
      form.householdId !==
      activeHouseholdId
    ) {
      errors.householdId =
        "Savings goal must belong to the active household.";
    }

    if (!form.name.trim()) {
      errors.name =
        "Savings goal name is required.";
    }

    if (
      !savingsGoalTypes.includes(
        form.goalType
      )
    ) {
      errors.goalType =
        "Select a valid savings goal type.";
    }

    if (
      !Number.isFinite(
        form.targetAmount
      ) ||
      form.targetAmount <= 0
    ) {
      errors.targetAmount =
        "Target amount must be greater than zero.";
    }

    this.validateTargetDate(
      form.targetDate,
      errors
    );

    if (
      !savingsGoalPriorities.includes(
        form.priority
      )
    ) {
      errors.priority =
        "Select a valid savings goal priority.";
    }

    if (
      !savingsGoalStatuses.includes(
        form.status
      )
    ) {
      errors.status =
        "Select a valid savings goal status.";
    }

    this.validateLinkedAccount(
      form,
      activeHouseholdId,
      errors
    );

    return {
      isValid:
        Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validates the optional target date.
   */
  private static validateTargetDate(
    targetDate: string,
    errors: Record<string, string>
  ): void {
    if (!targetDate) {
      return;
    }

    const parsedTargetDate =
      new Date(
        `${targetDate}T00:00:00`
      );

    if (
      Number.isNaN(
        parsedTargetDate.getTime()
      )
    ) {
      errors.targetDate =
        "Enter a valid target date.";
    }
  }

  /**
   * Validates the optional linked savings account.
   */
  private static validateLinkedAccount(
    form: SavingsGoalForm,
    activeHouseholdId: string,
    errors: Record<string, string>
  ): void {
    if (!form.linkedAccountId) {
      return;
    }

    const account =
      AccountService.getAccountById(
        form.linkedAccountId
      );

    if (!account) {
      errors.linkedAccountId =
        "Linked account was not found.";

      return;
    }

    if (
      account.householdId !==
      activeHouseholdId
    ) {
      errors.linkedAccountId =
        "Linked account must belong to the active household.";

      return;
    }

    if (!account.isActive) {
      errors.linkedAccountId =
        "Linked account must be active.";

      return;
    }

    if (
      account.accountClass !==
      "asset"
    ) {
      errors.linkedAccountId =
        "Savings goals may only link to asset accounts.";
    }
  }
}