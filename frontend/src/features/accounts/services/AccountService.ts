import type { Account } from "../models/Account";
import type { AccountForm } from "../models/AccountForm";

import AccountRepository from "../repositories/AccountRepository";
import AccountValidator from "../validators/AccountValidator";

import {
  OperationResults,
  type OperationResult,
} from "@/shared/types";

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
   * Calculates the total balance of all active accounts.
   */
  static getTotalBalance(): number {
    return this.getActiveAccounts().reduce(
      (total, account) => total + account.currentBalance,
      0
    );
  }

  /**
   * Finds an account by ID.
   */
  static getAccountById(
    id: string
  ): Account | undefined {
    return this.getAccounts().find(
      (account) => account.id === id
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
        form.institution?.trim() || undefined,

      type: form.type as Account["type"],

      currency: form.currency,

      openingBalance: form.balance,
      currentBalance: form.balance,

      accountNumber: undefined,

      isActive: form.isActive,

      createdAt: now,
      updatedAt: now,
    };

    const createdAccount =
      AccountRepository.create(account);

    return OperationResults.success(
      createdAccount,
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
        ["Account not found."],
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

    const updatedAccount: Account = {
      ...existing,

      name: form.name.trim(),
      institution:
        form.institution?.trim() || undefined,

      type: form.type as Account["type"],

      currency: form.currency,

      openingBalance: form.balance,

      isActive: form.isActive,

      updatedAt: new Date(),
    };

    AccountRepository.update(updatedAccount);

    return OperationResults.success(
      updatedAccount,
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
        ["Account not found."],
        "Unable to delete account."
      );
    }

    const deleted =
      AccountRepository.delete(id);

    if (!deleted) {
      return OperationResults.failure<boolean>(
        ["Unable to delete account."],
        "Delete failed."
      );
    }

    return OperationResults.success(
      true,
      "Account deleted successfully."
    );
  }
}