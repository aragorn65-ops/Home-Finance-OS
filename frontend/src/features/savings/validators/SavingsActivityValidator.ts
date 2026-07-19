import AccountService from "../../accounts/services/AccountService";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import {
  currencies,
} from "../../../shared/data/currencies";

import type {
  SavingsActivityType,
} from "../models/SavingsActivity";

import type {
  SavingsActivityForm,
} from "../models/SavingsActivityForm";

import SavingsGoalRepository from "../repositories/SavingsGoalRepository";

export interface SavingsActivityValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface SavingsActivityValidationContext {
  /**
   * ID of the single active household.
   */
  activeHouseholdId: string;

  /**
   * Goal balance before applying the proposed activity.
   *
   * For edits, this should exclude the effect of the
   * activity being replaced.
   */
  savedAmountBeforeActivity: number;

  /**
   * Optional account balance available after virtually
   * reversing an existing activity during an edit.
   *
   * When omitted, the account's current stored balance
   * is used.
   */
  availableAccountBalance?: number;
}

const savingsActivityTypes:
  SavingsActivityType[] = [
    "contribution",
    "withdrawal",
    "adjustment",
  ];

export default class SavingsActivityValidator {
  /**
   * Validates savings activity form data before
   * persistence or account-balance changes.
   */
  static validate(
    form: SavingsActivityForm,
    context: SavingsActivityValidationContext
  ): SavingsActivityValidationResult {
    const errors:
      Record<string, string> = {};

    this.validateHousehold(
      form,
      context,
      errors
    );

    this.validateGoal(
      form,
      context,
      errors
    );

    this.validateMember(
      form,
      context,
      errors
    );

    this.validateActivityType(
      form,
      errors
    );

    this.validateAmount(
      form,
      errors
    );

    this.validateCurrency(
      form,
      errors
    );

    this.validateActivityDate(
      form,
      errors
    );

    this.validateProjectedGoalBalance(
      form,
      context,
      errors
    );

    this.validateAccount(
      form,
      context,
      errors
    );

    return {
      isValid:
        Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Ensures the activity belongs to the active household.
   */
  private static validateHousehold(
    form: SavingsActivityForm,
    context: SavingsActivityValidationContext,
    errors: Record<string, string>
  ): void {
    if (
      !context.activeHouseholdId.trim()
    ) {
      errors.householdId =
        "Complete household setup before recording savings activity.";

      return;
    }

    if (
      form.householdId.trim() !==
      context.activeHouseholdId
    ) {
      errors.householdId =
        "Savings activity must belong to the active household.";
    }
  }

  /**
   * Validates the referenced savings goal.
   */
  private static validateGoal(
    form: SavingsActivityForm,
    context: SavingsActivityValidationContext,
    errors: Record<string, string>
  ): void {
    const savingsGoalId =
      form.savingsGoalId.trim();

    if (!savingsGoalId) {
      errors.savingsGoalId =
        "Select a savings goal.";

      return;
    }

    const savingsGoal =
      SavingsGoalRepository.findById(
        savingsGoalId
      );

    if (!savingsGoal) {
      errors.savingsGoalId =
        "Savings goal was not found.";

      return;
    }

    if (
      savingsGoal.householdId !==
        context.activeHouseholdId ||
      savingsGoal.householdId !==
        form.householdId.trim()
    ) {
      errors.savingsGoalId =
        "Savings goal does not belong to the active household.";

      return;
    }

    if (
      !savingsGoal.isActive ||
      savingsGoal.status ===
        "archived"
    ) {
      errors.savingsGoalId =
        "Archived savings goals cannot receive new activity.";
    }
  }

  /**
   * Validates the household member responsible for the
   * activity.
   */
  private static validateMember(
    form: SavingsActivityForm,
    context: SavingsActivityValidationContext,
    errors: Record<string, string>
  ): void {
    const memberId =
      form.memberId.trim();

    if (!memberId) {
      errors.memberId =
        "Select the household member responsible for this activity.";

      return;
    }

    const member =
      HouseholdMemberService
        .getMemberById(memberId);

    if (!member) {
      errors.memberId =
        "Household member was not found.";

      return;
    }

    if (
      member.householdId !==
      context.activeHouseholdId
    ) {
      errors.memberId =
        "Household member does not belong to the active household.";

      return;
    }

    if (!member.isActive) {
      errors.memberId =
        "Select an active household member.";
    }
  }

  /**
   * Validates the selected activity type.
   */
  private static validateActivityType(
    form: SavingsActivityForm,
    errors: Record<string, string>
  ): void {
    if (
      !savingsActivityTypes.includes(
        form.activityType
      )
    ) {
      errors.activityType =
        "Select a valid savings activity type.";
    }
  }

  /**
   * Validates the activity amount.
   *
   * Contributions and withdrawals require positive
   * amounts. Adjustments may be positive or negative,
   * but cannot be zero.
   */
  private static validateAmount(
    form: SavingsActivityForm,
    errors: Record<string, string>
  ): void {
    if (!Number.isFinite(form.amount)) {
      errors.amount =
        "Activity amount must be a valid number.";

      return;
    }

    if (
      form.activityType ===
        "adjustment"
    ) {
      if (
        this.roundCurrency(
          form.amount
        ) === 0
      ) {
        errors.amount =
          "Adjustment amount cannot be zero.";
      }

      return;
    }

    if (form.amount <= 0) {
      errors.amount =
        "Activity amount must be greater than zero.";
    }
  }

  /**
   * Validates the required activity date.
   */
  private static validateActivityDate(
    form: SavingsActivityForm,
    errors: Record<string, string>
  ): void {
    if (!form.activityDate) {
      errors.activityDate =
        "Activity date is required.";

      return;
    }

    const activityDate =
      new Date(
        `${form.activityDate}T00:00:00`
      );

    if (
      Number.isNaN(
        activityDate.getTime()
      )
    ) {
      errors.activityDate =
        "Enter a valid activity date.";
    }
  }

  /**
   * Ensures withdrawals and negative adjustments cannot
   * reduce the goal below zero.
   */
  private static validateProjectedGoalBalance(
    form: SavingsActivityForm,
    context: SavingsActivityValidationContext,
    errors: Record<string, string>
  ): void {
    if (
      !Number.isFinite(
        context.savedAmountBeforeActivity
      ) ||
      context.savedAmountBeforeActivity < 0
    ) {
      errors.general =
        "The current savings balance is invalid.";

      return;
    }

    const activityEffect =
      this.getGoalBalanceEffect(
        form
      );

    if (activityEffect === null) {
      return;
    }

    const projectedSavedAmount =
      this.roundCurrency(
        context.savedAmountBeforeActivity +
        activityEffect
      );

    if (projectedSavedAmount >= 0) {
      return;
    }

    errors.amount =
      form.activityType ===
      "withdrawal"
        ? "Withdrawal cannot exceed the amount currently saved."
        : "Negative adjustment cannot reduce the savings goal below zero.";
  }

  /**
   * Validates the optional account reference, ownership,
   * and available source-account balance.
   */
  private static validateAccount(
    form: SavingsActivityForm,
    context: SavingsActivityValidationContext,
    errors: Record<string, string>
  ): void {
    const accountId =
      form.accountId.trim();

    if (!accountId) {
      return;
    }

    const account =
      AccountService.getAccountById(
        accountId
      );

    if (!account) {
      errors.accountId =
        "Account was not found.";

      return;
    }

    if (
      account.householdId !==
        context.activeHouseholdId ||
      account.householdId !==
        form.householdId.trim()
    ) {
      errors.accountId =
        "Account does not belong to the active household.";

      return;
    }

    if (!account.isActive) {
      errors.accountId =
        "Select an active account.";

      return;
    }

    if (
      account.accountClass !==
      "asset"
    ) {
      errors.accountId =
        "Savings activity may only use an asset account.";

      return;
    }

    if (
      account.visibility ===
        "private" &&
      account.ownerMemberId !==
        form.memberId.trim()
    ) {
      errors.accountId =
        "Only the account owner may use this private account.";

      return;
    }

    const accountReduction =
      this.getAccountBalanceReduction(
        form
      );

    if (
      accountReduction === null ||
      accountReduction <= 0
    ) {
      return;
    }

    const availableBalance =
      context.availableAccountBalance ??
      account.currentBalance;

    if (
      !Number.isFinite(
        availableBalance
      )
    ) {
      errors.accountId =
        "The selected account has an invalid balance.";

      return;
    }

    if (
      this.roundCurrency(
        accountReduction
      ) >
      this.roundCurrency(
        availableBalance
      )
    ) {
      errors.amount =
        "The selected account does not have enough available funds.";
    }
  }

  /**
   * Returns the proposed change to the goal balance.
   */
  private static getGoalBalanceEffect(
    form: SavingsActivityForm
  ): number | null {
    if (!Number.isFinite(form.amount)) {
      return null;
    }

    if (
      form.activityType ===
      "contribution"
    ) {
      return form.amount;
    }

    if (
      form.activityType ===
      "withdrawal"
    ) {
      return -form.amount;
    }

    if (
      form.activityType ===
      "adjustment"
    ) {
      return form.amount;
    }

    return null;
  }

  /**
   * Returns the amount removed from the selected account.
   *
   * Contributions and positive adjustments reduce the
   * selected asset-account balance.
   *
   * Withdrawals and negative adjustments return funds to
   * the selected asset account.
   */
  private static getAccountBalanceReduction(
    form: SavingsActivityForm
  ): number | null {
    const goalBalanceEffect =
      this.getGoalBalanceEffect(
        form
      );

    if (goalBalanceEffect === null) {
      return null;
    }

    const baseBalanceEffect =
      goalBalanceEffect > 0
        ? Math.abs(
            form.baseAmount
          )
        : 0;

    return baseBalanceEffect > 0
      ? baseBalanceEffect
      : 0;
  }

  private static validateCurrency(
    form: SavingsActivityForm,
    errors: Record<string, string>
  ): void {
    const validCurrencies =
      currencies
        .map(
          (currency) =>
            currency.value
        )
        .filter(Boolean);

    if (
      !form.enteredCurrency ||
      !validCurrencies.includes(
        form.enteredCurrency
      )
    ) {
      errors.enteredCurrency =
        "Select a valid entered currency.";
    }

    if (
      !Number.isFinite(
        form.exchangeRate
      ) ||
      form.exchangeRate <= 0
    ) {
      errors.exchangeRate =
        "Enter a valid exchange rate.";
    }
  }

  /**
   * Applies currency-level decimal precision.
   */
  private static roundCurrency(
    amount: number
  ): number {
    return (
      Math.round(amount * 100) /
      100
    );
  }
}
