import type {
  AccountClass,
  AccountType,
  AccountVisibility,
} from "../models/Account";

import type { AccountForm } from "../models/AccountForm";

export interface AccountValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const assetAccountTypes: AccountType[] = [
  "checking",
  "savings",
  "cash",
  "e-wallet",
  "investment",
  "other-asset",
];

const liabilityAccountTypes: AccountType[] = [
  "credit-card",
  "line-of-credit",
  "loan",
  "mortgage",
  "other-liability",
];

const accountClasses: AccountClass[] = [
  "asset",
  "liability",
];

const accountVisibilities: AccountVisibility[] = [
  "household",
  "private",
];

export default class AccountValidator {
  /**
   * Validates account form data before persistence.
   */
  static validate(
    form: AccountForm
  ): AccountValidationResult {
    const errors: Record<string, string> = {};

    if (!form.ownerMemberId.trim()) {
      errors.ownerMemberId =
        "Select the member who owns this account.";
    }

    if (
      !accountVisibilities.includes(
        form.visibility
      )
    ) {
      errors.visibility =
        "Select a valid account visibility.";
    }

    if (!form.name.trim()) {
      errors.name = "Account name is required.";
    }

    if (
      !accountClasses.includes(
        form.accountClass
      )
    ) {
      errors.accountClass =
        "Select a valid account class.";
    }

    if (
      !assetAccountTypes.includes(form.type) &&
      !liabilityAccountTypes.includes(form.type)
    ) {
      errors.type =
        "Select a valid account type.";
    }

    if (
      form.accountClass === "asset" &&
      !assetAccountTypes.includes(form.type)
    ) {
      errors.type =
        "Select an asset account type.";
    }

    if (
      form.accountClass === "liability" &&
      !liabilityAccountTypes.includes(form.type)
    ) {
      errors.type =
        "Select a liability account type.";
    }

    if (!form.currency.trim()) {
      errors.currency = "Currency is required.";
    }

    if (
      !Number.isFinite(form.balance) ||
      form.balance < 0
    ) {
      errors.balance =
        form.accountClass === "liability"
          ? "The current amount owed cannot be negative."
          : "The account balance cannot be negative.";
    }

    this.validateLiabilityFields(
      form,
      errors
    );

    return {
      isValid:
        Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validates fields used by liability accounts.
   */
  private static validateLiabilityFields(
    form: AccountForm,
    errors: Record<string, string>
  ): void {
    if (form.accountClass !== "liability") {
      return;
    }

    if (
      !Number.isFinite(form.creditLimit) ||
      form.creditLimit < 0
    ) {
      errors.creditLimit =
        "Credit limit cannot be negative.";
    }

    if (
      form.type === "credit-card" &&
      form.creditLimit <= 0
    ) {
      errors.creditLimit =
        "Enter the credit-card limit.";
    }

    if (
      form.creditLimit > 0 &&
      form.balance > form.creditLimit
    ) {
      errors.balance =
        "The current amount owed exceeds the credit limit.";
    }

    if (
      !Number.isFinite(
        form.statementBalance
      ) ||
      form.statementBalance < 0
    ) {
      errors.statementBalance =
        "Statement balance cannot be negative.";
    }

    if (
      !Number.isFinite(
        form.minimumPayment
      ) ||
      form.minimumPayment < 0
    ) {
      errors.minimumPayment =
        "Minimum payment cannot be negative.";
    }

    if (
      form.statementBalance > 0 &&
      form.minimumPayment >
        form.statementBalance
    ) {
      errors.minimumPayment =
        "Minimum payment cannot exceed the statement balance.";
    }

    if (form.paymentDueDate) {
      const paymentDueDate = new Date(
        `${form.paymentDueDate}T00:00:00`
      );

      if (
        Number.isNaN(
          paymentDueDate.getTime()
        )
      ) {
        errors.paymentDueDate =
          "Enter a valid payment due date.";
      }
    }
  }
}