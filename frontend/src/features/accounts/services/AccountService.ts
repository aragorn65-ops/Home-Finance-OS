import type { Account } from "../models/Account";
import type { AccountForm } from "../models/AccountForm";

import AccountRepository from "../repositories/AccountRepository";
import AccountValidator from "../validators/AccountValidator";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types";
import {
  normalizeCurrency,
  normalizeExchangeRate,
  roundCurrencyAmount,
} from "../../../shared/utils/currencyConversion";
import {
  loadHousehold,
} from "../../household/services/householdStorage";

export default class AccountService {
  /**
   * Returns all accounts.
   *
   * This method is intended for trusted internal use.
   * Member-specific UI should later use an authorized
   * account query that applies privacy rules.
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
   * Returns active asset accounts.
   */
  static getAssetAccounts(): Account[] {
    return this.getActiveAccounts().filter(
      (account) =>
        account.accountClass === "asset"
    );
  }

  /**
   * Returns active liability accounts.
   */
  static getLiabilityAccounts(): Account[] {
    return this.getActiveAccounts().filter(
      (account) =>
        account.accountClass === "liability"
    );
  }

  /**
   * Calculates total active asset balances.
   */
  static getTotalAssets(): number {
    return this.getAssetAccounts().reduce(
      (total, account) =>
        total +
        this.getReportingBalance(
          account
        ),
      0
    );
  }

  /**
   * Calculates total active outstanding liabilities.
   */
  static getTotalLiabilities(): number {
    return this.getLiabilityAccounts().reduce(
      (total, account) =>
        total +
        this.getReportingBalance(
          account
        ),
      0
    );
  }

  /**
   * Returns the balance used for household reporting.
   */
  static getReportingBalance(
    account: Account
  ): number {
    return roundCurrencyAmount(
      account.currentBaseBalance ??
        account.currentBalance
    );
  }

  /**
   * Calculates net worth.
   *
   * Net worth = total assets - total liabilities.
   */
  static getNetWorth(): number {
    return (
      this.getTotalAssets() -
      this.getTotalLiabilities()
    );
  }

  /**
   * Compatibility method for existing account summaries.
   *
   * With liability support, the combined account balance
   * represents net worth rather than a simple balance sum.
   */
  static getTotalBalance(): number {
    return this.getNetWorth();
  }

  /**
   * Finds an account by ID.
   */
  static getAccountById(
    id: string
  ): Account | undefined {
    return AccountRepository.findById(id);
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
    const currencyDetails =
      this.resolveCurrencyDetails(form);

    const account: Account = {
      id: crypto.randomUUID(),
      householdId,

      ownerMemberId:
        form.ownerMemberId.trim(),

      visibility: form.visibility,

      name: form.name.trim(),

      institution:
        form.institution.trim() || undefined,

      accountClass: form.accountClass,
      type: form.type,

      currency:
        currencyDetails.currency,

      baseCurrency:
        currencyDetails.baseCurrency,

      exchangeRate:
        currencyDetails.exchangeRate,

      exchangeRateEffectiveDate:
        currencyDetails.exchangeRateEffectiveDate,
      exchangeRateSource:
        currencyDetails.exchangeRateSource,
      exchangeRateProvider:
        currencyDetails.exchangeRateProvider,

      openingBalance: form.balance,
      currentBalance: form.balance,
      openingBaseBalance:
        currencyDetails.openingBaseBalance,
      currentBaseBalance:
        currencyDetails.openingBaseBalance,

      accountNumber: undefined,

      creditLimit:
        form.accountClass === "liability"
          ? form.creditLimit
          : undefined,

      statementBalance:
        form.accountClass === "liability"
          ? form.statementBalance
          : undefined,

      minimumPayment:
        form.accountClass === "liability"
          ? form.minimumPayment
          : undefined,

      paymentDueDate:
        form.accountClass === "liability" &&
        form.paymentDueDate
          ? new Date(
              `${form.paymentDueDate}T00:00:00`
            )
          : undefined,

      isActive: form.isActive,

      createdAt: now,
      updatedAt: now,
    };

    const createdAccount =
      AccountRepository.create(account);

    if (!createdAccount) {
      return OperationResults.failure<Account>(
        {
          general:
            "Account could not be saved.",
        },
        "Unable to create account."
      );
    }

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

    const currencyDetails =
      this.resolveCurrencyDetails(form);

    const updatedAccount: Account = {
      ...existing,

      ownerMemberId:
        form.ownerMemberId.trim(),

      visibility: form.visibility,

      name: form.name.trim(),

      institution:
        form.institution.trim() || undefined,

      accountClass: form.accountClass,
      type: form.type,

      currency:
        currencyDetails.currency,

      baseCurrency:
        currencyDetails.baseCurrency,

      exchangeRate:
        currencyDetails.exchangeRate,

      exchangeRateEffectiveDate:
        currencyDetails.exchangeRateEffectiveDate,
      exchangeRateSource:
        currencyDetails.exchangeRateSource,
      exchangeRateProvider:
        currencyDetails.exchangeRateProvider,

      openingBalance:
        existing.openingBalance,
      openingBaseBalance:
        existing.openingBaseBalance ??
        roundCurrencyAmount(
          existing.openingBalance *
            currencyDetails.exchangeRate
        ),
      currentBalance:
        form.balance,
      currentBaseBalance:
        roundCurrencyAmount(
          form.balance *
            currencyDetails.exchangeRate
        ),

      creditLimit:
        form.accountClass === "liability"
          ? form.creditLimit
          : undefined,

      statementBalance:
        form.accountClass === "liability"
          ? form.statementBalance
          : undefined,

      minimumPayment:
        form.accountClass === "liability"
          ? form.minimumPayment
          : undefined,

      paymentDueDate:
        form.accountClass === "liability" &&
        form.paymentDueDate
          ? new Date(
              `${form.paymentDueDate}T00:00:00`
            )
          : undefined,

      isActive: form.isActive,

      updatedAt: new Date(),
    };

    const savedAccount =
      AccountRepository.update(updatedAccount);

    if (!savedAccount) {
      return OperationResults.failure<Account>(
        {
          general:
            "Account could not be saved.",
        },
        "Unable to update account."
      );
    }

    return OperationResults.success(
      savedAccount,
      "Account updated successfully."
    );
  }

  /**
   * Applies an accounting debit.
   *
   * Asset:
   * Debit increases the available balance.
   *
   * Liability:
   * Debit decreases the outstanding amount owed.
   *
   * Normal operations require an active account.
   */
  static debitAccount(
    id: string,
    amount: number
  ): OperationResult<Account> {
    const account =
      AccountRepository.findById(id);

    if (!account) {
      return this.accountNotFoundResult();
    }

    const amountError =
      this.validateOperationAmount(amount);

    if (amountError) {
      return amountError;
    }

    const balanceChange =
      account.accountClass === "asset"
        ? amount
        : -amount;

    return this.applyBalanceChange(
      account,
      balanceChange,
      "Account debited successfully."
    );
  }

  /**
   * Applies an accounting credit.
   *
   * Asset:
   * Credit decreases the available balance.
   *
   * Liability:
   * Credit increases the outstanding amount owed.
   *
   * Normal operations require an active account.
   */
  static creditAccount(
    id: string,
    amount: number
  ): OperationResult<Account> {
    const account =
      AccountRepository.findById(id);

    if (!account) {
      return this.accountNotFoundResult();
    }

    const amountError =
      this.validateOperationAmount(amount);

    if (amountError) {
      return amountError;
    }

    const balanceChange =
      account.accountClass === "asset"
        ? -amount
        : amount;

    return this.applyBalanceChange(
      account,
      balanceChange,
      "Account credited successfully."
    );
  }

  /**
   * Applies a historical accounting debit.
   *
   * This method is reserved for reversing or correcting
   * an already-recorded transaction or settlement.
   *
   * It may update an inactive account, but it does not
   * reactivate that account.
   */
  static debitAccountForHistoricalAdjustment(
    id: string,
    amount: number
  ): OperationResult<Account> {
    const account =
      AccountRepository.findById(id);

    if (!account) {
      return this.accountNotFoundResult();
    }

    const amountError =
      this.validateOperationAmount(amount);

    if (amountError) {
      return amountError;
    }

    const balanceChange =
      account.accountClass === "asset"
        ? amount
        : -amount;

    return this.applyBalanceChange(
      account,
      balanceChange,
      "Historical account debit applied successfully.",
      true
    );
  }

  /**
   * Applies a historical accounting credit.
   *
   * This method is reserved for reversing or correcting
   * an already-recorded transaction or settlement.
   *
   * It may update an inactive account, but it does not
   * reactivate that account.
   */
  static creditAccountForHistoricalAdjustment(
    id: string,
    amount: number
  ): OperationResult<Account> {
    const account =
      AccountRepository.findById(id);

    if (!account) {
      return this.accountNotFoundResult();
    }

    const amountError =
      this.validateOperationAmount(amount);

    if (amountError) {
      return amountError;
    }

    const balanceChange =
      account.accountClass === "asset"
        ? -amount
        : amount;

    return this.applyBalanceChange(
      account,
      balanceChange,
      "Historical account credit applied successfully.",
      true
    );
  }

  /**
   * Directly adjusts an account balance.
   *
   * Positive values increase the stored balance.
   * Negative values decrease the stored balance.
   *
   * Retained temporarily for compatibility while
   * TransactionService is migrated to debit and credit.
   */
  static adjustBalance(
    id: string,
    amount: number
  ): OperationResult<Account> {
    const account =
      AccountRepository.findById(id);

    if (!account) {
      return this.accountNotFoundResult();
    }

    if (!Number.isFinite(amount)) {
      return OperationResults.failure<Account>(
        {
          amount:
            "Balance adjustment must be a valid number.",
        },
        "Unable to adjust account balance."
      );
    }

    return this.applyBalanceChange(
      account,
      amount,
      "Account balance updated successfully."
    );
  }

  /**
   * Deletes an account.
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

  /**
   * Applies a raw stored-balance change.
   *
   * Inactive accounts remain protected unless an explicit
   * historical adjustment requests otherwise.
   */
  private static applyBalanceChange(
    account: Account,
    balanceChange: number,
    successMessage: string,
    allowInactive = false
  ): OperationResult<Account> {
    if (
      !account.isActive &&
      !allowInactive
    ) {
      return OperationResults.failure<Account>(
        {
          accountId: "Account is inactive.",
        },
        "Unable to update account balance."
      );
    }

    const nextBalance =
      account.currentBalance +
      balanceChange;

    if (
      account.accountClass === "liability" &&
      nextBalance < 0
    ) {
      return OperationResults.failure<Account>(
        {
          amount:
            "The payment exceeds the outstanding liability balance.",
        },
        "Unable to update liability balance."
      );
    }

    const updatedAccount: Account = {
      ...account,

      currentBalance: nextBalance,
      currentBaseBalance:
        roundCurrencyAmount(
          nextBalance *
            (account.exchangeRate ?? 1)
        ),

      updatedAt: new Date(),
    };

    const savedAccount =
      AccountRepository.update(updatedAccount);

    if (!savedAccount) {
      return OperationResults.failure<Account>(
        {
          general:
            "Account balance could not be saved.",
        },
        "Unable to update account balance."
      );
    }

    return OperationResults.success(
      savedAccount,
      successMessage
    );
  }

  /**
   * Validates debit and credit amounts.
   */
  private static validateOperationAmount(
    amount: number
  ): OperationResult<Account> | null {
    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return OperationResults.failure<Account>(
        {
          amount:
            "Account operation amount must be greater than zero.",
        },
        "Unable to update account balance."
      );
    }

    return null;
  }

  /**
   * Creates a consistent account-not-found result.
   */
  private static accountNotFoundResult():
    OperationResult<Account> {
    return OperationResults.failure<Account>(
      {
        accountId: "Account not found.",
      },
      "Unable to update account balance."
    );
  }

  private static resolveCurrencyDetails(
    form: AccountForm
  ): {
    currency: string;
    baseCurrency: string;
    exchangeRate: number;
    exchangeRateEffectiveDate?: Date;
    exchangeRateSource: "manual" | "api";
    exchangeRateProvider?: string;
    openingBaseBalance: number;
  } {
    const household =
      loadHousehold();

    const baseCurrency =
      normalizeCurrency(
        form.baseCurrency ||
          household?.currency ||
          "PHP"
      );

    const currency =
      normalizeCurrency(
        form.currency,
        baseCurrency
      );

    const exchangeRate =
      normalizeExchangeRate(
        form.exchangeRate,
        currency,
        baseCurrency
      ) || 1;

    const effectiveDate =
      form.exchangeRateEffectiveDate
        ? new Date(
            `${form.exchangeRateEffectiveDate}T00:00:00`
          )
        : undefined;

    return {
      currency,
      baseCurrency,
      exchangeRate,
      exchangeRateEffectiveDate:
        effectiveDate,
      exchangeRateSource:
        form.exchangeRateSource === "api"
          ? "api"
          : "manual",
      exchangeRateProvider:
        form.exchangeRateSource === "api"
          ? form.exchangeRateProvider.trim() ||
            undefined
          : undefined,
      openingBaseBalance:
        roundCurrencyAmount(
          form.balance *
            exchangeRate
        ),
    };
  }
}
