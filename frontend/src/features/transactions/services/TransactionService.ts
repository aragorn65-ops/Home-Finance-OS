import type {
  Transaction,
  TransactionVisibility,
} from "../models/Transaction";

import type { TransactionForm } from "../models/TransactionForm";
import {
  isCanonicalTransactionCategory,
  normalizeTransactionCategory,
} from "../models/TransactionCategory";

import type {
  AllocationPaymentStatus,
  ExpenseAllocation,
} from "../models/ExpenseAllocation";

import TransactionRepository from "../repositories/TransactionRepository";
import TransactionValidator from "../validators/TransactionValidator";

import AccountService from "../../accounts/services/AccountService";
import HouseholdMemberService from "../../household/services/HouseholdMemberService";
import {
  loadHousehold,
} from "../../household/services/householdStorage";

import AllocationPaymentService from "../../settlements/services/AllocationPaymentService";

import ExpenseAllocationService from "./ExpenseAllocationService";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types/index";

import {
  convertEnteredAmount,
  normalizeCurrency,
  normalizeExchangeRate,
  roundCurrencyAmount,
} from "../../../shared/utils/currencyConversion";

type AccountOperationType =
  | "debit"
  | "credit";

interface AccountOperation {
  accountId: string;
  type: AccountOperationType;
  amount: number;
}

interface NormalizedTransactionCurrency {
  amount: number;
  enteredAmount: number;
  enteredCurrency: string;
  baseCurrency: string;
  baseAmount: number;
  exchangeRate: number;
  exchangeRateEffectiveDate: Date;
  exchangeRateSource: "manual" | "api";
  exchangeRateProvider?: string;
}

export default class TransactionService {
  private static normalizeSourceAccountId(
    form: TransactionForm
  ): string | null {
    if (form.type === "income") {
      return null;
    }

    const sourceAccountId =
      form.sourceAccountId.trim();

    return sourceAccountId || null;
  }

  private static normalizeDestinationAccountId(
    form: TransactionForm
  ): string | null {
    if (form.type === "expense") {
      return null;
    }

    const destinationAccountId =
      form.destinationAccountId.trim();

    return destinationAccountId || null;
  }

  private static normalizeCategoryForStorage(
    category: string
  ): string {
    const trimmedCategory =
      category.trim();

    const normalizedCategory =
      normalizeTransactionCategory(
        trimmedCategory
      );

    if (
      normalizedCategory === "Other" &&
      !isCanonicalTransactionCategory(
        trimmedCategory
      )
    ) {
      return trimmedCategory;
    }

    return normalizedCategory;
  }

  /**
   * Returns all transactions ordered by transaction date,
   * newest first.
   *
   * Use getTransactionsForMember when displaying
   * member-specific transaction data.
   */
  static getTransactions(): Transaction[] {
    return TransactionRepository.findAll().sort(
      (first, second) =>
        second.transactionDate.getTime() -
        first.transactionDate.getTime()
    );
  }

  /**
   * Returns transactions visible to a household member.
   */
  static getTransactionsForMember(
    memberId: string
  ): Transaction[] {
    return this.getTransactions().filter(
      (transaction) =>
        this.canMemberViewTransaction(
          transaction,
          memberId
        )
    );
  }

  /**
   * Returns active transactions.
   */
  static getActiveTransactions(): Transaction[] {
    return this.getTransactions().filter(
      (transaction) =>
        transaction.isActive
    );
  }

  /**
   * Returns active transactions visible to a member.
   */
  static getActiveTransactionsForMember(
    memberId: string
  ): Transaction[] {
    return this.getTransactionsForMember(
      memberId
    ).filter(
      (transaction) =>
        transaction.isActive
    );
  }

  /**
   * Finds a transaction by ID.
   */
  static getTransactionById(
    id: string
  ): Transaction | undefined {
    return TransactionRepository.findById(
      id
    );
  }

  /**
   * Finds a transaction only when the member may view it.
   */
  static getTransactionByIdForMember(
    id: string,
    memberId: string
  ): Transaction | undefined {
    const transaction =
      TransactionRepository.findById(
        id
      );

    if (
      !transaction ||
      !this.canMemberViewTransaction(
        transaction,
        memberId
      )
    ) {
      return undefined;
    }

    return transaction;
  }

  /**
   * Determines whether a member may view a transaction.
   */
  static canMemberViewTransaction(
    transaction: Transaction,
    memberId: string
  ): boolean {
    const normalizedMemberId =
      memberId.trim();

    if (!normalizedMemberId) {
      return false;
    }

    const visibility =
      transaction.visibility ??
      "household";

    if (
      visibility ===
      "household"
    ) {
      return true;
    }

    if (
      transaction.createdByMemberId ===
        normalizedMemberId ||
      transaction.paidByMemberId ===
        normalizedMemberId
    ) {
      return true;
    }

    if (
      visibility ===
      "private"
    ) {
      return false;
    }

    const allocations =
      ExpenseAllocationService
        .getByTransactionId(
          transaction.id
        );

    return allocations.some(
      (allocation) =>
        allocation.isIncluded &&
        allocation.memberId ===
          normalizedMemberId
    );
  }

  /**
   * Returns member allocations belonging to an expense.
   */
  static getExpenseAllocations(
    transactionId: string
  ): ExpenseAllocation[] {
    return ExpenseAllocationService
      .getByTransactionId(
        transactionId
      );
  }

  /**
   * Derives the reimbursement payment status for an
   * expense transaction.
   *
   * Returns undefined when the transaction is not an
   * expense or has no payable member allocations.
   */
  static getExpensePaymentStatus(
    transactionId: string
  ): AllocationPaymentStatus | undefined {
    const transaction =
      TransactionRepository.findById(
        transactionId.trim()
      );

    if (
      !transaction ||
      transaction.type !==
        "expense"
    ) {
      return undefined;
    }

    const payableAllocations =
      ExpenseAllocationService
        .getByTransactionId(
          transaction.id
        )
        .filter(
          (allocation) =>
            allocation.isIncluded &&
            allocation.allocatedAmount >
              0 &&
            allocation.memberId !==
              allocation.paidByMemberId
        );

    if (
      payableAllocations.length ===
      0
    ) {
      return undefined;
    }

    const paymentStatuses =
      payableAllocations.map(
        (allocation) =>
          AllocationPaymentService
            .getPaymentStatus(
              allocation
            )
      );

    if (
      paymentStatuses.every(
        (status) =>
          status ===
          "paid"
      )
    ) {
      return "paid";
    }

    if (
      paymentStatuses.every(
        (status) =>
          status ===
          "unpaid"
      )
    ) {
      return "unpaid";
    }

    return "partially-paid";
  }

  /**
   * Returns the most recent active transactions.
   */
  static getRecentTransactions(
    limit = 5
  ): Transaction[] {
    if (
      !Number.isInteger(limit) ||
      limit <= 0
    ) {
      return [];
    }

    return this.getActiveTransactions()
      .slice(
        0,
        limit
      );
  }

  /**
   * Returns recent active transactions visible to a member.
   */
  static getRecentTransactionsForMember(
    memberId: string,
    limit = 5
  ): Transaction[] {
    if (
      !Number.isInteger(limit) ||
      limit <= 0
    ) {
      return [];
    }

    return this
      .getActiveTransactionsForMember(
        memberId
      )
      .slice(
        0,
        limit
      );
  }

  /**
   * Returns active transactions for the month containing
   * the supplied reference date.
   */
  static getTransactionsForMonth(
    referenceDate: Date = new Date()
  ): Transaction[] {
    const year =
      referenceDate.getFullYear();

    const month =
      referenceDate.getMonth();

    return this
      .getActiveTransactions()
      .filter(
        (transaction) =>
          transaction.transactionDate
            .getFullYear() ===
            year &&
          transaction.transactionDate
            .getMonth() ===
            month
      );
  }

  /**
   * Calculates total income for a month.
   */
  static getTotalIncome(
    referenceDate: Date = new Date()
  ): number {
    return this
      .getTransactionsForMonth(
        referenceDate
      )
      .filter(
        (transaction) =>
          transaction.type ===
          "income"
      )
      .reduce(
        (total, transaction) =>
          total +
          transaction.amount,
        0
      );
  }

  /**
   * Calculates total expenses for a month.
   */
  static getTotalExpenses(
    referenceDate: Date = new Date()
  ): number {
    return this
      .getTransactionsForMonth(
        referenceDate
      )
      .filter(
        (transaction) =>
          transaction.type ===
          "expense"
      )
      .reduce(
        (total, transaction) =>
          total +
          transaction.amount,
        0
      );
  }

  /**
   * Calculates net cash flow for a month.
   *
   * Transfers are excluded because they move value
   * between household accounts.
   */
  static getNetCashFlow(
    referenceDate: Date = new Date()
  ): number {
    return (
      this.getTotalIncome(
        referenceDate
      ) -
      this.getTotalExpenses(
        referenceDate
      )
    );
  }

  /**
   * Creates a transaction, updates linked account balances,
   * and creates member expense allocations.
   */
  static create(
    form: TransactionForm,
    householdId: string
  ): OperationResult<Transaction> {
    const validation =
      TransactionValidator.validate(
        form
      );

    if (!validation.isValid) {
      return OperationResults.failure<
        Transaction
      >(
        validation.errors,
        "Please correct the validation errors."
      );
    }

    const memberErrors =
      this.validateMemberReferences(
        form,
        householdId
      );

    if (
      Object.keys(
        memberErrors
      ).length >
      0
    ) {
      return OperationResults.failure<
        Transaction
      >(
        memberErrors,
        "Please correct the household member errors."
      );
    }

    const accountErrors =
      this.validateAccountReferences(
        form,
        householdId
      );

    if (
      Object.keys(
        accountErrors
      ).length >
      0
    ) {
      return OperationResults.failure<
        Transaction
      >(
        accountErrors,
        "Please correct the account errors."
      );
    }

    const now =
      new Date();

    const currencyDetails =
      this.normalizeCurrencyDetails(
        form,
        householdId
      );

    const recordedByMemberId =
      form.paidByMemberId
        .trim() ||
      undefined;

    const transaction:
      Transaction = {
        id:
          crypto.randomUUID(),

        householdId,

        createdByMemberId:
          recordedByMemberId,

        paidByMemberId:
          form.type ===
          "expense"
            ? recordedByMemberId
            : undefined,

        expenseSplitMethod:
          form.type ===
          "expense"
            ? form.splitMethod
            : undefined,

        visibility:
          this.resolveTransactionVisibility(
            form
          ),

        type:
          form.type,

        amount:
          currencyDetails.amount,

        enteredAmount:
          currencyDetails
            .enteredAmount,

        enteredCurrency:
          currencyDetails
            .enteredCurrency,

        baseCurrency:
          currencyDetails
            .baseCurrency,

        baseAmount:
          currencyDetails.baseAmount,

        exchangeRate:
          currencyDetails
            .exchangeRate,

        exchangeRateEffectiveDate:
          currencyDetails
            .exchangeRateEffectiveDate,
        exchangeRateSource:
          currencyDetails
            .exchangeRateSource,
        exchangeRateProvider:
          currencyDetails
            .exchangeRateProvider,

        sourceAccountId:
          this.normalizeSourceAccountId(
            form
          ),

        destinationAccountId:
          this.normalizeDestinationAccountId(
            form
          ),

        category:
          this.normalizeCategoryForStorage(
            form.category
          ),

        description:
          form.description.trim(),

        notes:
          form.notes.trim(),

        attachments:
          this.cloneAttachments(
            form.attachments
          ),

        transactionDate:
          new Date(
            `${form.transactionDate}T00:00:00`
          ),

        isActive:
          form.isActive,

        createdAt: now,
        updatedAt: now,
      };

    const balanceResult =
      this.applyBalanceEffects(
        transaction
      );

    if (
      !balanceResult.success
    ) {
      return OperationResults.failure<
        Transaction
      >(
        balanceResult.errors,
        balanceResult.message ??
          "Unable to update account balances."
      );
    }

    const createdTransaction =
      TransactionRepository.create(
        transaction
      );

    if (!createdTransaction) {
      const balanceRollback =
        this.reverseBalanceEffects(
          transaction
        );

      if (
        !balanceRollback.success
      ) {
        return OperationResults.failure<
          Transaction
        >(
          {
            general:
              "The transaction could not be saved and its account balance effects could not be reversed.",
          },
          "Critical transaction persistence rollback failure."
        );
      }

      return OperationResults.failure<
        Transaction
      >(
        {
          general:
            "Transaction could not be saved.",
        },
        "Unable to create transaction."
      );
    }

    const allocationResult =
      this.createExpenseAllocations(
        createdTransaction,
        form
      );

    if (
      !allocationResult.success
    ) {
      const transactionDeleted =
        TransactionRepository.delete(
          createdTransaction.id
        );

      if (!transactionDeleted) {
        return OperationResults.failure<
          Transaction
        >(
          {
            general:
              "Expense allocations could not be created and the persisted transaction could not be removed.",
          },
          "Critical transaction persistence rollback failure."
        );
      }

      const balanceRollback =
        this.reverseBalanceEffects(
          createdTransaction
        );

      if (
        !balanceRollback.success
      ) {
        return OperationResults.failure<
          Transaction
        >(
          {
            general:
              "The transaction allocation failed and account balances could not be restored.",
          },
          "Critical transaction rollback failure."
        );
      }

      return OperationResults.failure<
        Transaction
      >(
        allocationResult.errors,
        allocationResult.message ??
          "Unable to create expense allocations."
      );
    }

    return OperationResults.success(
      createdTransaction,
      "Transaction created successfully."
    );
  }

  /**
   * Updates a transaction, replaces account effects,
   * and replaces associated expense allocations.
   */
  static update(
    id: string,
    form: TransactionForm
  ): OperationResult<Transaction> {
    const existing =
      TransactionRepository.findById(
        id
      );

    if (!existing) {
      return OperationResults.failure<
        Transaction
      >(
        {
          general:
            "Transaction not found.",
        },
        "Unable to update transaction."
      );
    }

    const validation =
      TransactionValidator.validate(
        form
      );

    if (!validation.isValid) {
      return OperationResults.failure<
        Transaction
      >(
        validation.errors,
        "Please correct the validation errors."
      );
    }

    const memberErrors =
      this.validateMemberReferences(
        form,
        existing.householdId
      );

    if (
      Object.keys(
        memberErrors
      ).length >
      0
    ) {
      return OperationResults.failure<
        Transaction
      >(
        memberErrors,
        "Please correct the household member errors."
      );
    }

    const accountErrors =
      this.validateAccountReferences(
        form,
        existing.householdId
      );

    if (
      Object.keys(
        accountErrors
      ).length >
      0
    ) {
      return OperationResults.failure<
        Transaction
      >(
        accountErrors,
        "Please correct the account errors."
      );
    }

    const selectedMemberId =
      form.paidByMemberId
        .trim() ||
      undefined;

    const currencyDetails =
      this.normalizeCurrencyDetails(
        form,
        existing.householdId
      );

    const updatedTransaction:
      Transaction = {
        ...existing,

        createdByMemberId:
          existing.createdByMemberId ??
          selectedMemberId,

        paidByMemberId:
          form.type ===
          "expense"
            ? selectedMemberId
            : undefined,

        expenseSplitMethod:
          form.type ===
          "expense"
            ? form.splitMethod
            : undefined,

        visibility:
          this.resolveTransactionVisibility(
            form
          ),

        type:
          form.type,

        amount:
          currencyDetails.amount,

        enteredAmount:
          currencyDetails
            .enteredAmount,

        enteredCurrency:
          currencyDetails
            .enteredCurrency,

        baseCurrency:
          currencyDetails
            .baseCurrency,

        baseAmount:
          currencyDetails.baseAmount,

        exchangeRate:
          currencyDetails
            .exchangeRate,

        exchangeRateEffectiveDate:
          currencyDetails
            .exchangeRateEffectiveDate,
        exchangeRateSource:
          currencyDetails
            .exchangeRateSource,
        exchangeRateProvider:
          currencyDetails
            .exchangeRateProvider,

        sourceAccountId:
          this.normalizeSourceAccountId(
            form
          ),

        destinationAccountId:
          this.normalizeDestinationAccountId(
            form
          ),

        category:
          this.normalizeCategoryForStorage(
            form.category
          ),

        description:
          form.description.trim(),

        notes:
          form.notes.trim(),

        attachments:
          this.cloneAttachments(
            form.attachments
          ),

        transactionDate:
          new Date(
            `${form.transactionDate}T00:00:00`
          ),

        isActive:
          form.isActive,

        updatedAt:
          new Date(),
      };

    const reversalResult =
      this.reverseBalanceEffects(
        existing
      );

    if (
      !reversalResult.success
    ) {
      return OperationResults.failure<
        Transaction
      >(
        reversalResult.errors,
        reversalResult.message ??
          "Unable to reverse the existing transaction."
      );
    }

    const applyResult =
      this.applyBalanceEffects(
        updatedTransaction
      );

    if (
      !applyResult.success
    ) {
      const restorationResult =
        this.applyBalanceEffects(
          existing,
          true
        );

      if (
        !restorationResult.success
      ) {
        return OperationResults.failure<
          Transaction
        >(
          {
            general:
              "The update failed and the previous account balances could not be restored.",
          },
          "Critical balance restoration failure."
        );
      }

      return OperationResults.failure<
        Transaction
      >(
        applyResult.errors,
        applyResult.message ??
          "Unable to apply the updated transaction."
      );
    }

    const savedTransaction =
      TransactionRepository.update(
        id,
        updatedTransaction
      );

    if (!savedTransaction) {
      const rollbackResult =
        this.rollbackUpdatedBalanceEffects(
          existing,
          updatedTransaction
        );

      if (
        !rollbackResult.success
      ) {
        return OperationResults.failure<
          Transaction
        >(
          rollbackResult.errors,
          rollbackResult.message ??
            "Unable to restore the original transaction balances."
        );
      }

      return OperationResults.failure<
        Transaction
      >(
        {
          general:
            "Transaction could not be saved.",
        },
        "Unable to update transaction."
      );
    }

    const allocationResult =
      this.replaceExpenseAllocations(
        savedTransaction,
        form
      );

    if (
      !allocationResult.success
    ) {
      const restoredTransaction =
        TransactionRepository.update(
          existing.id,
          existing
        );

      if (!restoredTransaction) {
        return OperationResults.failure<
          Transaction
        >(
          {
            general:
              "Expense allocations could not be updated and the original transaction could not be restored.",
          },
          "Critical transaction persistence rollback failure."
        );
      }

      const rollbackResult =
        this.rollbackUpdatedBalanceEffects(
          existing,
          updatedTransaction
        );

      if (
        !rollbackResult.success
      ) {
        return OperationResults.failure<
          Transaction
        >(
          {
            general:
              "The allocation update failed and previous account balances could not be restored.",
          },
          "Critical transaction rollback failure."
        );
      }

      return OperationResults.failure<
        Transaction
      >(
        allocationResult.errors,
        allocationResult.message ??
          "Unable to update expense allocations."
      );
    }

    return OperationResults.success(
      savedTransaction,
      "Transaction updated successfully."
    );
  }

  /**
   * Deletes a transaction, reverses its account effects,
   * and removes associated expense allocations.
   */
  static delete(
    id: string
  ): OperationResult<boolean> {
    const existing =
      TransactionRepository.findById(
        id
      );

    if (!existing) {
      return OperationResults.failure<
        boolean
      >(
        {
          general:
            "Transaction not found.",
        },
        "Unable to delete transaction."
      );
    }

    const reversalResult =
      this.reverseBalanceEffects(
        existing
      );

    if (
      !reversalResult.success
    ) {
      return OperationResults.failure<
        boolean
      >(
        reversalResult.errors,
        reversalResult.message ??
          "Unable to reverse the transaction."
      );
    }

    const deleted =
      TransactionRepository.delete(
        id
      );

    if (!deleted) {
      const restorationResult =
        this.applyBalanceEffects(
          existing,
          true
        );

      if (
        !restorationResult.success
      ) {
        return OperationResults.failure<
          boolean
        >(
          {
            general:
              "The transaction could not be deleted and its account balances could not be restored.",
          },
          "Critical balance restoration failure."
        );
      }

      return OperationResults.failure<
        boolean
      >(
        {
          general:
            "Transaction could not be deleted.",
        },
        "Delete failed."
      );
    }

    const allocationDeleteResult =
      ExpenseAllocationService
        .deleteForTransaction(
          id
        );

    if (
      !allocationDeleteResult.success
    ) {
      const restoredTransaction =
        TransactionRepository.create(
          existing
        );

      if (!restoredTransaction) {
        return OperationResults.failure<
          boolean
        >(
          {
            general:
              "Expense allocations could not be deleted and the original transaction could not be restored.",
          },
          "Critical transaction persistence restoration failure."
        );
      }

      const balanceRestoration =
        this.applyBalanceEffects(
          existing,
          true
        );

      if (
        !balanceRestoration.success
      ) {
        return OperationResults.failure<
          boolean
        >(
          {
            general:
              "Expense allocations could not be deleted and the transaction balance effects could not be restored.",
          },
          "Critical transaction restoration failure."
        );
      }

      return OperationResults.failure<
        boolean
      >(
        allocationDeleteResult.errors,
        allocationDeleteResult.message ??
          "Unable to delete expense allocations."
      );
    }

    return OperationResults.success(
      true,
      "Transaction deleted successfully."
    );
  }

  /**
   * Creates member allocations for a new expense.
   */
  private static createExpenseAllocations(
    transaction: Transaction,
    form: TransactionForm
  ): OperationResult<
    ExpenseAllocation[]
  > {
    if (
      transaction.type !==
      "expense"
    ) {
      return OperationResults.success(
        []
      );
    }

    return ExpenseAllocationService
      .createForTransaction(
        transaction.id,
        transaction.householdId,
        form.paidByMemberId,
        form.splitMethod,
        transaction.amount,
        form.allocations
      );
  }

  /**
   * Replaces allocations when a transaction is edited.
   */
  private static replaceExpenseAllocations(
    transaction: Transaction,
    form: TransactionForm
  ): OperationResult<
    ExpenseAllocation[]
  > {
    if (
      transaction.type !==
      "expense"
    ) {
      return ExpenseAllocationService
        .replaceForTransaction(
          transaction.id,
          transaction.householdId,
          "",
          "none",
          transaction.amount,
          []
        );
    }

    return ExpenseAllocationService
      .replaceForTransaction(
        transaction.id,
        transaction.householdId,
        form.paidByMemberId,
        form.splitMethod,
        transaction.amount,
        form.allocations
      );
  }

  private static normalizeCurrencyDetails(
    form: TransactionForm,
    householdId: string
  ): NormalizedTransactionCurrency {
    const household =
      loadHousehold();

    const baseCurrency =
      normalizeCurrency(
        household?.id === householdId
          ? household.currency
          : undefined
      );

    const transactionDate =
      new Date(
        `${form.transactionDate}T00:00:00`
      );

    const exchangeRateEffectiveDate =
      form.exchangeRateEffectiveDate
        ? new Date(
            `${form.exchangeRateEffectiveDate}T00:00:00`
          )
        : transactionDate;

    if (
      form.type !== "income" &&
      form.type !== "expense"
    ) {
      const amount =
        roundCurrencyAmount(
          form.amount
        );

      return {
        amount,
        enteredAmount:
          amount,
        enteredCurrency:
          baseCurrency,
        baseCurrency,
        baseAmount:
          amount,
        exchangeRate: 1,
        exchangeRateEffectiveDate:
          transactionDate,
        exchangeRateSource: "manual",
      };
    }

    const enteredCurrency =
      normalizeCurrency(
        form.enteredCurrency,
        baseCurrency
      );

    const exchangeRate =
      normalizeExchangeRate(
        form.exchangeRate,
        enteredCurrency,
        baseCurrency
      ) || 1;

    const conversion =
      convertEnteredAmount(
        form.amount,
        enteredCurrency,
        baseCurrency,
        baseCurrency,
        exchangeRate
      );

    return {
      amount:
        conversion.baseAmount,
      enteredAmount:
        roundCurrencyAmount(
          form.amount
        ),
      enteredCurrency,
      baseCurrency,
      baseAmount:
        conversion.baseAmount,
      exchangeRate,
      exchangeRateEffectiveDate:
        exchangeRateEffectiveDate,
      exchangeRateSource:
        form.exchangeRateSource === "api"
          ? "api"
          : "manual",
      exchangeRateProvider:
        form.exchangeRateSource === "api"
          ? form.exchangeRateProvider?.trim() ||
            undefined
          : undefined,
    };
  }

  /**
   * Returns defensive copies of transaction attachments.
   */
  private static cloneAttachments(
    attachments:
      TransactionForm["attachments"]
  ): TransactionForm["attachments"] {
    return attachments.map(
      (attachment) => ({
        ...attachment,

        createdAt:
          new Date(
            attachment.createdAt
          ),
      })
    );
  }

  /**
   * Validates referenced accounts and private ownership.
   */
  private static validateAccountReferences(
    form: TransactionForm,
    householdId: string
  ): Record<string, string> {
    const errors:
      Record<string, string> = {};

    const selectedMemberId =
      form.paidByMemberId
        .trim();

    const validateAccount = (
      accountId: string,
      field:
        | "sourceAccountId"
        | "destinationAccountId",
      label: string
    ) => {
      const account =
        AccountService.getAccountById(
          accountId.trim()
        );

      if (!account) {
        errors[field] =
          `${label} account was not found.`;

        return undefined;
      }

      if (
        account.householdId !==
        householdId
      ) {
        errors[field] =
          `${label} account does not belong to this household.`;

        return undefined;
      }

      if (!account.isActive) {
        errors[field] =
          `${label} account is inactive.`;

        return undefined;
      }

      if (
        account.visibility ===
        "private"
      ) {
        if (!selectedMemberId) {
          errors.paidByMemberId =
            "Select the member using the private account.";

          errors[field] =
            `${label} account is private.`;

          return undefined;
        }

        if (
          !account.ownerMemberId ||
          account.ownerMemberId !==
            selectedMemberId
        ) {
          errors[field] =
            `Only the owner of this private ${label.toLowerCase()} account may use it.`;

          return undefined;
        }
      }

      return account;
    };

    if (
      form.type ===
      "income"
    ) {
      const destinationAccount =
        validateAccount(
          form.destinationAccountId,
          "destinationAccountId",
          "Destination"
        );

      if (
        destinationAccount &&
        destinationAccount
          .accountClass !==
          "asset"
      ) {
        errors.destinationAccountId =
          "Income must be deposited into an asset account. Use a transfer to pay a liability.";
      }
    }

    if (
      form.type ===
        "expense" &&
      form.sourceAccountId
        .trim()
    ) {
      validateAccount(
        form.sourceAccountId,
        "sourceAccountId",
        "Payment"
      );
    }

    if (
      form.type ===
      "transfer"
    ) {
      validateAccount(
        form.sourceAccountId,
        "sourceAccountId",
        "Source"
      );

      validateAccount(
        form.destinationAccountId,
        "destinationAccountId",
        "Destination"
      );
    }

    return errors;
  }

  /**
   * Validates the recording member, payer, and participants.
   */
  private static validateMemberReferences(
    form: TransactionForm,
    householdId: string
  ): Record<string, string> {
    const errors:
      Record<string, string> = {};

    const selectedMemberId =
      form.paidByMemberId
        .trim();

    if (selectedMemberId) {
      const selectedMember =
        HouseholdMemberService
          .getMemberById(
            selectedMemberId
          );

      if (!selectedMember) {
        errors.paidByMemberId =
          "The selected household member was not found.";

        return errors;
      }

      if (
        selectedMember.householdId !==
          householdId ||
        !selectedMember.isActive
      ) {
        errors.paidByMemberId =
          "The selected member must be active and belong to this household.";

        return errors;
      }
    }

    if (
      form.type !==
      "expense"
    ) {
      return errors;
    }

    if (!selectedMemberId) {
      errors.paidByMemberId =
        "Select the member who paid the expense.";

      return errors;
    }

    const seenMemberIds =
      new Set<string>();

    for (
      const allocation of
      form.allocations
    ) {
      const memberId =
        allocation.memberId
          .trim();

      if (
        !memberId ||
        seenMemberIds.has(
          memberId
        )
      ) {
        continue;
      }

      seenMemberIds.add(
        memberId
      );

      const member =
        HouseholdMemberService
          .getMemberById(
            memberId
          );

      if (
        !member ||
        member.householdId !==
          householdId ||
        !member.isActive
      ) {
        errors.allocations =
          "Every expense participant must be an active member of this household.";

        break;
      }
    }

    return errors;
  }

  /**
   * Applies safe visibility defaults when private
   * accounts are linked.
   */
  private static resolveTransactionVisibility(
    form: TransactionForm
  ): TransactionVisibility {
    const accountIds = [
      form.sourceAccountId.trim(),
      form.destinationAccountId.trim(),
    ].filter(
      Boolean
    );

    const hasPrivateAccount =
      accountIds.some(
        (accountId) => {
          const account =
            AccountService
              .getAccountById(
                accountId
              );

          return (
            account?.visibility ===
            "private"
          );
        }
      );

    if (!hasPrivateAccount) {
      return form.visibility;
    }

    const isSharedExpense =
      form.type ===
        "expense" &&
      form.splitMethod !==
        "none" &&
      form.allocations.some(
        (allocation) =>
          allocation.isIncluded
      );

    if (isSharedExpense) {
      return "participants";
    }

    return "private";
  }

  /**
   * Applies transaction accounting effects.
   *
   * Historical restoration may update an inactive account
   * without changing the account's activation status.
   */
  private static applyBalanceEffects(
    transaction: Transaction,
    historicalAdjustment = false
  ): OperationResult<boolean> {
    if (
      !transaction.isActive
    ) {
      return OperationResults.success(
        true
      );
    }

    const operations =
      this.buildAccountOperations(
        transaction,
        false
      );

    if (
      !operations.success
    ) {
      return OperationResults.failure<
        boolean
      >(
        operations.errors,
        operations.message ??
          "Unable to build account operations."
      );
    }

    return this.executeAccountOperations(
      operations.data ?? [],
      historicalAdjustment
    );
  }

  /**
   * Reverses transaction accounting effects.
   *
   * Reversal is a historical correction and may therefore
   * update an inactive account.
   */
  private static reverseBalanceEffects(
    transaction: Transaction
  ): OperationResult<boolean> {
    if (
      !transaction.isActive
    ) {
      return OperationResults.success(
        true
      );
    }

    const operations =
      this.buildAccountOperations(
        transaction,
        true
      );

    if (
      !operations.success
    ) {
      return OperationResults.failure<
        boolean
      >(
        operations.errors,
        operations.message ??
          "Unable to build reversal operations."
      );
    }

    return this.executeAccountOperations(
      operations.data ?? [],
      true
    );
  }

  /**
   * Reverses updated effects and restores original effects.
   */
  private static rollbackUpdatedBalanceEffects(
    existing: Transaction,
    updated: Transaction
  ): OperationResult<boolean> {
    const updatedReversal =
      this.reverseBalanceEffects(
        updated
      );

    if (
      !updatedReversal.success
    ) {
      return OperationResults.failure<
        boolean
      >(
        updatedReversal.errors,
        "Unable to reverse the updated transaction effects."
      );
    }

    const originalRestoration =
      this.applyBalanceEffects(
        existing,
        true
      );

    if (
      !originalRestoration.success
    ) {
      return OperationResults.failure<
        boolean
      >(
        originalRestoration.errors,
        "Unable to restore the original transaction effects."
      );
    }

    return OperationResults.success(
      true
    );
  }

  /**
   * Builds debit and credit operations for a transaction.
   */
  private static buildAccountOperations(
    transaction: Transaction,
    reverse: boolean
  ): OperationResult<
    AccountOperation[]
  > {
    if (
      transaction.type ===
      "income"
    ) {
      if (
        !transaction.destinationAccountId
      ) {
        return OperationResults.failure<
          AccountOperation[]
        >(
          {
            destinationAccountId:
              "Destination account is required.",
          },
          "Unable to process income."
        );
      }

      const amountResult =
        this.resolveIncomeAccountAmount(
          transaction,
          transaction.destinationAccountId
        );

      if (!amountResult.success) {
        return OperationResults.failure<
          AccountOperation[]
        >(
          amountResult.errors,
          amountResult.message ??
            "Unable to process income."
        );
      }

      return OperationResults.success([
        {
          accountId:
            transaction.destinationAccountId,

          type:
            reverse
              ? "credit"
              : "debit",

          amount:
            amountResult.data ??
            transaction.amount,
        },
      ]);
    }

    if (
      transaction.type ===
      "expense"
    ) {
      if (
        !transaction.sourceAccountId
      ) {
        return OperationResults.success(
          []
        );
      }

      const amountResult =
        this.resolveExpenseAccountAmount(
          transaction,
          transaction.sourceAccountId
        );

      if (!amountResult.success) {
        return OperationResults.failure<
          AccountOperation[]
        >(
          amountResult.errors,
          amountResult.message ??
            "Unable to process expense."
        );
      }

      return OperationResults.success([
        {
          accountId:
            transaction.sourceAccountId,

          type:
            reverse
              ? "debit"
              : "credit",

          amount:
            amountResult.data ??
            transaction.amount,
        },
      ]);
    }

    if (
      !transaction.sourceAccountId ||
      !transaction.destinationAccountId
    ) {
      return OperationResults.failure<
        AccountOperation[]
      >(
        {
          general:
            "Source and destination accounts are required.",
        },
        "Unable to process transfer."
      );
    }

    if (reverse) {
      return OperationResults.success([
        {
          accountId:
            transaction.destinationAccountId,

          type:
            "credit",

          amount:
            transaction.amount,
        },
        {
          accountId:
            transaction.sourceAccountId,

          type:
            "debit",

          amount:
            transaction.amount,
        },
      ]);
    }

    return OperationResults.success([
      {
        accountId:
          transaction.sourceAccountId,

        type:
          "credit",

        amount:
          transaction.amount,
      },
      {
        accountId:
          transaction.destinationAccountId,

        type:
          "debit",

        amount:
          transaction.amount,
      },
    ]);
  }

  /**
   * Executes account operations sequentially.
   *
   * Historical operations may update inactive accounts.
   */
  private static executeAccountOperations(
    operations:
      AccountOperation[],
    historicalAdjustment = false
  ): OperationResult<boolean> {
    const completedOperations:
      AccountOperation[] = [];

    for (
      const operation of
      operations
    ) {
      const result =
        this.executeAccountOperation(
          operation,
          historicalAdjustment
        );

      if (!result.success) {
        const rollbackResult =
          this.rollbackAccountOperations(
            completedOperations,
            historicalAdjustment
          );

        if (
          !rollbackResult.success
        ) {
          return OperationResults.failure<
            boolean
          >(
            {
              general:
                "The transaction failed and completed account operations could not be fully rolled back.",
            },
            "Critical account rollback failure."
          );
        }

        return OperationResults.failure<
          boolean
        >(
          result.errors,
          result.message ??
            "Unable to update the account balance."
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

  private static resolveIncomeAccountAmount(
    transaction: Transaction,
    accountId: string
  ): OperationResult<number> {
    const account =
      AccountService.getAccountById(
        accountId
      );

    if (!account) {
      return OperationResults.failure<number>(
        {
          accountId: "Account not found.",
        },
        "Unable to process income."
      );
    }

    const baseCurrency =
      normalizeCurrency(
        transaction.baseCurrency,
        account.baseCurrency ??
          account.currency
      );

    const accountCurrency =
      normalizeCurrency(
        account.currency,
        baseCurrency
      );

    const enteredCurrency =
      normalizeCurrency(
        transaction.enteredCurrency,
        baseCurrency
      );

    if (
      transaction.enteredAmount !==
        undefined &&
      accountCurrency ===
        enteredCurrency
    ) {
      return OperationResults.success(
        roundCurrencyAmount(
          transaction.enteredAmount
        )
      );
    }

    if (
      accountCurrency ===
      baseCurrency
    ) {
      return OperationResults.success(
        roundCurrencyAmount(
          transaction.baseAmount ??
            transaction.amount
        )
      );
    }

    return OperationResults.failure<number>(
      {
        destinationAccountId:
          "Income currency does not match the destination account currency.",
      },
      "Unable to process mixed-currency income."
    );
  }

  private static resolveExpenseAccountAmount(
    transaction: Transaction,
    accountId: string
  ): OperationResult<number> {
    const account =
      AccountService.getAccountById(
        accountId
      );

    if (!account) {
      return OperationResults.failure<number>(
        {
          accountId: "Account not found.",
        },
        "Unable to process expense."
      );
    }

    const baseCurrency =
      normalizeCurrency(
        transaction.baseCurrency,
        account.baseCurrency ??
          account.currency
      );

    const accountCurrency =
      normalizeCurrency(
        account.currency,
        baseCurrency
      );

    const enteredCurrency =
      normalizeCurrency(
        transaction.enteredCurrency,
        baseCurrency
      );

    if (
      transaction.enteredAmount !==
        undefined &&
      accountCurrency ===
        enteredCurrency
    ) {
      return OperationResults.success(
        roundCurrencyAmount(
          transaction.enteredAmount
        )
      );
    }

    if (
      accountCurrency ===
      baseCurrency
    ) {
      return OperationResults.success(
        roundCurrencyAmount(
          transaction.baseAmount ??
            transaction.amount
        )
      );
    }

    return OperationResults.failure<number>(
      {
        sourceAccountId:
          "Expense currency does not match the payment account currency.",
      },
      "Unable to process mixed-currency expense."
    );
  }

  /**
   * Executes one accounting debit or credit.
   */
  private static executeAccountOperation(
    operation: AccountOperation,
    historicalAdjustment = false
  ) {
    if (
      operation.type ===
      "debit"
    ) {
      return historicalAdjustment
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

    return historicalAdjustment
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
   * Reverses completed account operations.
   */
  private static rollbackAccountOperations(
    completedOperations:
      AccountOperation[],
    historicalAdjustment = false
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
        };

      const result =
        this.executeAccountOperation(
          inverseOperation,
          historicalAdjustment
        );

      if (!result.success) {
        return OperationResults.failure<
          boolean
        >(
          result.errors,
          result.message ??
            "Unable to roll back an account operation."
        );
      }
    }

    return OperationResults.success(
      true
    );
  }
}
