import type {
  Transaction,
  TransactionVisibility,
} from "../models/Transaction";

import type { TransactionForm } from "../models/TransactionForm";
import type { ExpenseAllocation } from "../models/ExpenseAllocation";

import TransactionRepository from "../repositories/TransactionRepository";
import TransactionValidator from "../validators/TransactionValidator";

import AccountService from "../../accounts/services/AccountService";
import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import ExpenseAllocationService from "./ExpenseAllocationService";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types";

type AccountOperationType =
  | "debit"
  | "credit";

interface AccountOperation {
  accountId: string;
  type: AccountOperationType;
  amount: number;
}

export default class TransactionService {
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
      (transaction) => transaction.isActive
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
      (transaction) => transaction.isActive
    );
  }

  /**
   * Finds a transaction by ID.
   */
  static getTransactionById(
    id: string
  ): Transaction | undefined {
    return TransactionRepository.findById(id);
  }

  /**
   * Finds a transaction only when the member may view it.
   */
  static getTransactionByIdForMember(
    id: string,
    memberId: string
  ): Transaction | undefined {
    const transaction =
      TransactionRepository.findById(id);

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

    if (visibility === "household") {
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

    if (visibility === "private") {
      return false;
    }

    const allocations =
      ExpenseAllocationService.getByTransactionId(
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
    return ExpenseAllocationService.getByTransactionId(
      transactionId
    );
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

    return this.getActiveTransactions().slice(
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

    return this.getActiveTransactionsForMember(
      memberId
    ).slice(0, limit);
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

    return this.getActiveTransactions().filter(
      (transaction) =>
        transaction.transactionDate.getFullYear() ===
          year &&
        transaction.transactionDate.getMonth() ===
          month
    );
  }

  /**
   * Calculates total income for a month.
   */
  static getTotalIncome(
    referenceDate: Date = new Date()
  ): number {
    return this.getTransactionsForMonth(
      referenceDate
    )
      .filter(
        (transaction) =>
          transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
        0
      );
  }

  /**
   * Calculates total expenses for a month.
   */
  static getTotalExpenses(
    referenceDate: Date = new Date()
  ): number {
    return this.getTransactionsForMonth(
      referenceDate
    )
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total + transaction.amount,
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
      this.getTotalIncome(referenceDate) -
      this.getTotalExpenses(referenceDate)
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
      TransactionValidator.validate(form);

    if (!validation.isValid) {
      return OperationResults.failure<Transaction>(
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
      Object.keys(memberErrors).length >
      0
    ) {
      return OperationResults.failure<Transaction>(
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
      Object.keys(accountErrors).length >
      0
    ) {
      return OperationResults.failure<Transaction>(
        accountErrors,
        "Please correct the account errors."
      );
    }

    const now = new Date();

    const recordedByMemberId =
      form.paidByMemberId.trim() ||
      undefined;

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      householdId,

      createdByMemberId:
        recordedByMemberId,

      paidByMemberId:
        form.type === "expense"
          ? recordedByMemberId
          : undefined,

      expenseSplitMethod:
        form.type === "expense"
          ? form.splitMethod
          : undefined,

      visibility:
        this.resolveTransactionVisibility(
          form
        ),

      type:
        form.type,

      amount:
        form.amount,

      sourceAccountId:
        form.type === "income"
          ? null
          : form.sourceAccountId.trim(),

      destinationAccountId:
        form.type === "expense"
          ? null
          : form.destinationAccountId.trim(),

      category:
        form.category.trim(),

      description:
        form.description.trim(),

      notes:
        form.notes.trim(),

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

    if (!balanceResult.success) {
      return OperationResults.failure<Transaction>(
        balanceResult.errors,
        balanceResult.message ??
          "Unable to update account balances."
      );
    }

    const createdTransaction =
      TransactionRepository.create(
        transaction
      );

    const allocationResult =
      this.createExpenseAllocations(
        createdTransaction,
        form
      );

    if (!allocationResult.success) {
      TransactionRepository.delete(
        createdTransaction.id
      );

      const balanceRollback =
        this.reverseBalanceEffects(
          createdTransaction
        );

      if (!balanceRollback.success) {
        return OperationResults.failure<Transaction>(
          {
            general:
              "The transaction allocation failed and account balances could not be restored.",
          },
          "Critical transaction rollback failure."
        );
      }

      return OperationResults.failure<Transaction>(
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
      TransactionRepository.findById(id);

    if (!existing) {
      return OperationResults.failure<Transaction>(
        {
          general:
            "Transaction not found.",
        },
        "Unable to update transaction."
      );
    }

    const validation =
      TransactionValidator.validate(form);

    if (!validation.isValid) {
      return OperationResults.failure<Transaction>(
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
      Object.keys(memberErrors).length >
      0
    ) {
      return OperationResults.failure<Transaction>(
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
      Object.keys(accountErrors).length >
      0
    ) {
      return OperationResults.failure<Transaction>(
        accountErrors,
        "Please correct the account errors."
      );
    }

    const selectedMemberId =
      form.paidByMemberId.trim() ||
      undefined;

    const updatedTransaction: Transaction = {
      ...existing,

      createdByMemberId:
        existing.createdByMemberId ??
        selectedMemberId,

      paidByMemberId:
        form.type === "expense"
          ? selectedMemberId
          : undefined,

      expenseSplitMethod:
        form.type === "expense"
          ? form.splitMethod
          : undefined,

      visibility:
        this.resolveTransactionVisibility(
          form
        ),

      type:
        form.type,

      amount:
        form.amount,

      sourceAccountId:
        form.type === "income"
          ? null
          : form.sourceAccountId.trim(),

      destinationAccountId:
        form.type === "expense"
          ? null
          : form.destinationAccountId.trim(),

      category:
        form.category.trim(),

      description:
        form.description.trim(),

      notes:
        form.notes.trim(),

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

    if (!reversalResult.success) {
      return OperationResults.failure<Transaction>(
        reversalResult.errors,
        reversalResult.message ??
          "Unable to reverse the existing transaction."
      );
    }

    const applyResult =
      this.applyBalanceEffects(
        updatedTransaction
      );

    if (!applyResult.success) {
      const restorationResult =
        this.applyBalanceEffects(
          existing
        );

      if (!restorationResult.success) {
        return OperationResults.failure<Transaction>(
          {
            general:
              "The update failed and the previous account balances could not be restored.",
          },
          "Critical balance restoration failure."
        );
      }

      return OperationResults.failure<Transaction>(
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

      if (!rollbackResult.success) {
        return OperationResults.failure<Transaction>(
          rollbackResult.errors,
          rollbackResult.message
        );
      }

      return OperationResults.failure<Transaction>(
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

    if (!allocationResult.success) {
      TransactionRepository.update(
        existing.id,
        existing
      );

      const rollbackResult =
        this.rollbackUpdatedBalanceEffects(
          existing,
          updatedTransaction
        );

      if (!rollbackResult.success) {
        return OperationResults.failure<Transaction>(
          {
            general:
              "The allocation update failed and previous account balances could not be restored.",
          },
          "Critical transaction rollback failure."
        );
      }

      return OperationResults.failure<Transaction>(
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
      TransactionRepository.findById(id);

    if (!existing) {
      return OperationResults.failure<boolean>(
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

    if (!reversalResult.success) {
      return OperationResults.failure<boolean>(
        reversalResult.errors,
        reversalResult.message ??
          "Unable to reverse the transaction."
      );
    }

    const deleted =
      TransactionRepository.delete(id);

    if (!deleted) {
      const restorationResult =
        this.applyBalanceEffects(
          existing
        );

      if (!restorationResult.success) {
        return OperationResults.failure<boolean>(
          {
            general:
              "The transaction could not be deleted and its account balances could not be restored.",
          },
          "Critical balance restoration failure."
        );
      }

      return OperationResults.failure<boolean>(
        {
          general:
            "Transaction could not be deleted.",
        },
        "Delete failed."
      );
    }

    const allocationDeleteResult =
      ExpenseAllocationService
        .deleteForTransaction(id);

    if (!allocationDeleteResult.success) {
      TransactionRepository.create(
        existing
      );

      const balanceRestoration =
        this.applyBalanceEffects(
          existing
        );

      if (!balanceRestoration.success) {
        return OperationResults.failure<boolean>(
          {
            general:
              "Expense allocations could not be deleted and the transaction balance effects could not be restored.",
          },
          "Critical transaction restoration failure."
        );
      }

      return OperationResults.failure<boolean>(
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
  ): OperationResult<ExpenseAllocation[]> {
    if (transaction.type !== "expense") {
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
  ): OperationResult<ExpenseAllocation[]> {
    if (transaction.type !== "expense") {
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

  /**
   * Validates referenced accounts and private ownership.
   */
  private static validateAccountReferences(
    form: TransactionForm,
    householdId: string
  ): Record<string, string> {
    const errors: Record<string, string> = {};

    const selectedMemberId =
      form.paidByMemberId.trim();

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

    if (form.type === "income") {
      const destinationAccount =
        validateAccount(
          form.destinationAccountId,
          "destinationAccountId",
          "Destination"
        );

      if (
        destinationAccount &&
        destinationAccount.accountClass !==
          "asset"
      ) {
        errors.destinationAccountId =
          "Income must be deposited into an asset account. Use a transfer to pay a liability.";
      }
    }

    if (form.type === "expense") {
      validateAccount(
        form.sourceAccountId,
        "sourceAccountId",
        "Payment"
      );
    }

    if (form.type === "transfer") {
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
    const errors: Record<string, string> = {};

    const selectedMemberId =
      form.paidByMemberId.trim();

    if (selectedMemberId) {
      const selectedMember =
        HouseholdMemberService.getMemberById(
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

    if (form.type !== "expense") {
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
        allocation.memberId.trim();

      if (
        !memberId ||
        seenMemberIds.has(memberId)
      ) {
        continue;
      }

      seenMemberIds.add(memberId);

      const member =
        HouseholdMemberService.getMemberById(
          memberId
        );

      if (
        !member ||
        member.householdId !== householdId ||
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
    ].filter(Boolean);

    const hasPrivateAccount =
      accountIds.some((accountId) => {
        const account =
          AccountService.getAccountById(
            accountId
          );

        return (
          account?.visibility ===
          "private"
        );
      });

    if (!hasPrivateAccount) {
      return form.visibility;
    }

    const isSharedExpense =
      form.type === "expense" &&
      form.splitMethod !== "none" &&
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
   */
  private static applyBalanceEffects(
    transaction: Transaction
  ): OperationResult<boolean> {
    if (!transaction.isActive) {
      return OperationResults.success(
        true
      );
    }

    const operations =
      this.buildAccountOperations(
        transaction,
        false
      );

    if (!operations.success) {
      return OperationResults.failure<boolean>(
        operations.errors,
        operations.message ??
          "Unable to build account operations."
      );
    }

    return this.executeAccountOperations(
      operations.data ?? []
    );
  }

  /**
   * Reverses transaction accounting effects.
   */
  private static reverseBalanceEffects(
    transaction: Transaction
  ): OperationResult<boolean> {
    if (!transaction.isActive) {
      return OperationResults.success(
        true
      );
    }

    const operations =
      this.buildAccountOperations(
        transaction,
        true
      );

    if (!operations.success) {
      return OperationResults.failure<boolean>(
        operations.errors,
        operations.message ??
          "Unable to build reversal operations."
      );
    }

    return this.executeAccountOperations(
      operations.data ?? []
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

    if (!updatedReversal.success) {
      return OperationResults.failure<boolean>(
        updatedReversal.errors,
        "Unable to reverse the updated transaction effects."
      );
    }

    const originalRestoration =
      this.applyBalanceEffects(
        existing
      );

    if (!originalRestoration.success) {
      return OperationResults.failure<boolean>(
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
  ): OperationResult<AccountOperation[]> {
    if (transaction.type === "income") {
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

      return OperationResults.success([
        {
          accountId:
            transaction.destinationAccountId,

          type: reverse
            ? "credit"
            : "debit",

          amount:
            transaction.amount,
        },
      ]);
    }

    if (transaction.type === "expense") {
      if (!transaction.sourceAccountId) {
        return OperationResults.failure<
          AccountOperation[]
        >(
          {
            sourceAccountId:
              "Payment account is required.",
          },
          "Unable to process expense."
        );
      }

      return OperationResults.success([
        {
          accountId:
            transaction.sourceAccountId,

          type: reverse
            ? "debit"
            : "credit",

          amount:
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

          type: "credit",

          amount:
            transaction.amount,
        },
        {
          accountId:
            transaction.sourceAccountId,

          type: "debit",

          amount:
            transaction.amount,
        },
      ]);
    }

    return OperationResults.success([
      {
        accountId:
          transaction.sourceAccountId,

        type: "credit",

        amount:
          transaction.amount,
      },
      {
        accountId:
          transaction.destinationAccountId,

        type: "debit",

        amount:
          transaction.amount,
      },
    ]);
  }

  /**
   * Executes account operations sequentially.
   */
  private static executeAccountOperations(
    operations: AccountOperation[]
  ): OperationResult<boolean> {
    const completedOperations:
      AccountOperation[] = [];

    for (
      const operation of operations
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
          return OperationResults.failure<boolean>(
            {
              general:
                "The transaction failed and completed account operations could not be fully rolled back.",
            },
            "Critical account rollback failure."
          );
        }

        return OperationResults.failure<boolean>(
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

  /**
   * Executes one accounting debit or credit.
   */
  private static executeAccountOperation(
    operation: AccountOperation
  ) {
    if (
      operation.type === "debit"
    ) {
      return AccountService.debitAccount(
        operation.accountId,
        operation.amount
      );
    }

    return AccountService.creditAccount(
      operation.accountId,
      operation.amount
    );
  }

  /**
   * Reverses completed account operations.
   */
  private static rollbackAccountOperations(
    completedOperations:
      AccountOperation[]
  ): OperationResult<boolean> {
    const reversedOperations = [
      ...completedOperations,
    ].reverse();

    for (
      const operation of reversedOperations
    ) {
      const inverseOperation:
        AccountOperation = {
          ...operation,

          type:
            operation.type === "debit"
              ? "credit"
              : "debit",
        };

      const result =
        this.executeAccountOperation(
          inverseOperation
        );

      if (!result.success) {
        return OperationResults.failure<boolean>(
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