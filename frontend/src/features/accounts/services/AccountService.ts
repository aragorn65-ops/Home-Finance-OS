import type { Account } from "../models/Account";
import type { AccountForm } from "../models/AccountForm";

import AccountRepository from "../repositories/AccountRepository";
import AccountValidator from "../validators/AccountValidator";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types";

export default class AccountService {
  /**
   * Returns all accounts.
   */
  static getAccounts(): Account[] {
    return AccountRepository.findAll();
  }

  /**
   * Returns active accounts.
   */
  static getActiveAccounts(): Account[] {
    return this.getAccounts().filter(
      (account) => account.isActive
    );
  }

  /**
   * Returns an account by ID.
   */
  static getAccountById(
    id: string
  ): Account | undefined {
    return AccountRepository.findById(id);
  }

  /**
   * Calculates the total balance of active accounts.
   */
  static getTotalBalance(): number {
    return this.getActiveAccounts().reduce(
      (total, account) =>
        total + account.currentBalance,
      0
    );
  }

  /**
   * Creates a new account.
   */
  static create(
    form: AccountForm,
    householdId: string
  ): OperationResult<Account> {
    const validation =
      AccountValidator.validate(form);

    if (!validation.isValid) {
      return OperationResults.failure<Account>(
        validation.errors,
        "Please correct the validation errors."
      );
    }

    const now = new Date();

    const account: Account = {
      id: crypto.randomUUID(),
      householdId,

      name: form.name.trim(),
      institution:
        form.institution.trim() || undefined,

      type: form.type as Account["type"],

      currency: form.currency,

      openingBalance: form.balance,
      currentBalance: form.balance,

      accountNumber: undefined,

      isActive: form.isActive,

      createdAt: now,
      updatedAt: now,
    };

    const created =
      AccountRepository.create(account);

    return OperationResults.success(
      created,
      "Account created successfully."
    );
  }

  /**
   * Updates an existing account.
   */
  static update(
    id: string,
    form: AccountForm
  ): OperationResult<Account> {
    const existing =
      AccountRepository.findById(id);

    if (!existing) {
      return OperationResults.failure<Account>(
        {
          general: "Account not found.",
        },
        "Unable to update account."
      );
    }

    const validation =
      AccountValidator.validate(form);

    if (!validation.isValid) {
      return OperationResults.failure<Account>(
        validation.errors,
        "Please correct the validation errors."
      );
    }

    const updated: Account = {
      ...existing,

      name: form.name.trim(),
      institution:
        form.institution.trim() || undefined,

      type: form.type as Account["type"],

      currency: form.currency,

      openingBalance: form.balance,

      currentBalance:
        existing.currentBalance,

      accountNumber:
        existing.accountNumber,

      isActive: form.isActive,

      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };

    AccountRepository.update(updated);

    return OperationResults.success(
      updated,
      "Account updated successfully."
    );
  }

  /**
   * Soft deletes an account.
   */
  static delete(
    id: string
  ): OperationResult<boolean> {
    const account =
      AccountRepository.findById(id);

    if (!account) {
      return OperationResults.failure<boolean>(
        {
          general: "Account not found.",
        },
        "Unable to delete account."
      );
    }

    const deleted =
      AccountRepository.delete(id);

    if (!deleted) {
      return OperationResults.failure<boolean>(
        {
          general:
            "Unable to delete account.",
        },
        "Delete failed."
      );
    }

    return OperationResults.success(
      true,
      "Account deleted successfully."
    );
  }
}