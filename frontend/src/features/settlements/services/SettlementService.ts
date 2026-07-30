import type { Settlement } from "../models/Settlement";
import type { SettlementForm } from "../models/SettlementForm";
import type { SettlementApplication } from "../models/SettlementApplication";

import SettlementRepository from "../repositories/SettlementRepository";
import SettlementApplicationRepository from "../repositories/SettlementApplicationRepository";

import SettlementValidator from "../validators/SettlementValidator";

import AccountService from "../../accounts/services/AccountService";

import SettlementApplicationService from "./SettlementApplicationService";

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

export default class SettlementService {
  /**
   * Returns all settlements ordered by settlement date,
   * newest first.
   */
  static getSettlements(): Settlement[] {
    return SettlementRepository
      .findAll()
      .sort(
        (first, second) =>
          second.settlementDate.getTime() -
          first.settlementDate.getTime()
      );
  }

  /**
   * Returns active settlements.
   */
  static getActiveSettlements():
    Settlement[] {
    return this
      .getSettlements()
      .filter(
        (settlement) =>
          settlement.isActive
      );
  }

  /**
   * Returns settlements belonging to a household.
   */
  static getSettlementsByHouseholdId(
    householdId: string
  ): Settlement[] {
    return SettlementRepository
      .findByHouseholdId(
        householdId
      )
      .sort(
        (first, second) =>
          second.settlementDate.getTime() -
          first.settlementDate.getTime()
      );
  }

  /**
   * Returns active settlements belonging
   * to a household.
   */
  static getActiveSettlementsByHouseholdId(
    householdId: string
  ): Settlement[] {
    return SettlementRepository
      .findActiveByHouseholdId(
        householdId
      )
      .sort(
        (first, second) =>
          second.settlementDate.getTime() -
          first.settlementDate.getTime()
      );
  }

  /**
   * Finds a settlement by ID.
   */
  static getSettlementById(
    id: string
  ): Settlement | undefined {
    return SettlementRepository
      .findById(
        id
      );
  }

  /**
   * Returns applications belonging
   * to a settlement.
   */
  static getApplications(
    settlementId: string
  ): SettlementApplication[] {
    return SettlementApplicationRepository
      .findBySettlementId(
        settlementId
      );
  }

  /**
   * Creates a settlement, applies optional account
   * effects, and persists its allocation applications.
   */
  static create(
    form: SettlementForm
  ): OperationResult<Settlement> {
    const validation =
      SettlementValidator.validate(
        form
      );

    if (!validation.isValid) {
      return OperationResults.failure<
        Settlement
      >(
        validation.errors,
        "Please correct the settlement validation errors."
      );
    }

    const accountErrors =
      this.validateAccountReferences(
        form
      );

    if (
      Object.keys(
        accountErrors
      ).length >
      0
    ) {
      return OperationResults.failure<
        Settlement
      >(
        accountErrors,
        "Please correct the settlement account errors."
      );
    }

    const now =
      new Date();

    const settlement: Settlement = {
      id:
        crypto.randomUUID(),

      householdId:
        form.householdId.trim(),

      fromMemberId:
        form.fromMemberId.trim(),

      toMemberId:
        form.toMemberId.trim(),

      amount:
        this.roundCurrency(
          form.amount
        ),

      settlementDate:
        new Date(
          `${form.settlementDate}T00:00:00`
        ),

      sourceAccountId:
        form.sourceAccountId
          .trim() ||
        undefined,

      destinationAccountId:
        form.destinationAccountId
          .trim() ||
        undefined,

      applicationMethod:
        form.applicationMethod,

      referenceNumber:
        form.referenceNumber
          .trim() ||
        undefined,

      notes:
        form.notes.trim() ||
        undefined,

      attachments:
        [],

      isActive:
        form.isActive,

      createdAt: now,
      updatedAt: now,
    };

    const applicationResult =
      this.buildApplications(
        settlement,
        form
      );

    if (
      !applicationResult.success
    ) {
      return OperationResults.failure<
        Settlement
      >(
        applicationResult.errors,
        applicationResult.message ??
          "Unable to prepare settlement applications."
      );
    }

    const balanceResult =
      this.applyBalanceEffects(
        settlement
      );

    if (!balanceResult.success) {
      return OperationResults.failure<
        Settlement
      >(
        balanceResult.errors,
        balanceResult.message ??
          "Unable to update settlement account balances."
      );
    }

    const createdSettlement =
      SettlementRepository.create(
        settlement
      );

    if (!createdSettlement) {
      const balanceRollback =
        this.reverseBalanceEffects(
          settlement
        );

      if (!balanceRollback.success) {
        return OperationResults.failure<
          Settlement
        >(
          {
            general:
              "The settlement could not be saved and its account effects could not be reversed.",
          },
          "Critical settlement persistence rollback failure."
        );
      }

      return OperationResults.failure<
        Settlement
      >(
        {
          general:
            "Settlement could not be saved.",
        },
        "Unable to create settlement."
      );
    }

    const applications =
      applicationResult.data ?? [];

    const createdApplications =
      SettlementApplicationRepository
        .createMany(
          applications
        );

    if (!createdApplications) {
      const settlementDeleted =
        SettlementRepository.delete(
          createdSettlement.id
        );

      if (!settlementDeleted) {
        return OperationResults.failure<
          Settlement
        >(
          {
            general:
              "Settlement applications could not be saved and the persisted settlement could not be removed.",
          },
          "Critical settlement persistence rollback failure."
        );
      }

      const balanceRollback =
        this.reverseBalanceEffects(
          createdSettlement
        );

      if (!balanceRollback.success) {
        return OperationResults.failure<
          Settlement
        >(
          {
            general:
              "Settlement applications could not be saved and the settlement account effects could not be reversed.",
          },
          "Critical settlement account rollback failure."
        );
      }

      return OperationResults.failure<
        Settlement
      >(
        {
          applications:
            "Settlement applications could not be saved.",
        },
        "Unable to create settlement."
      );
    }

    return OperationResults.success(
      createdSettlement,
      "Settlement created successfully."
    );
  }

  /**
   * Updates a settlement and replaces all associated
   * applications with rollback protection.
   *
   * Existing applications are removed before rebuilding
   * so the settlement does not reduce the outstanding
   * allocations against which its replacement is validated.
   */
  static update(
    id: string,
    form: SettlementForm
  ): OperationResult<Settlement> {
    const existing =
      SettlementRepository.findById(
        id
      );

    if (!existing) {
      return OperationResults.failure<
        Settlement
      >(
        {
          general:
            "Settlement not found.",
        },
        "Unable to update settlement."
      );
    }

    const validation =
      SettlementValidator.validate(
        form
      );

    if (!validation.isValid) {
      return OperationResults.failure<
        Settlement
      >(
        validation.errors,
        "Please correct the settlement validation errors."
      );
    }

    if (
      form.householdId.trim() !==
      existing.householdId
    ) {
      return OperationResults.failure<
        Settlement
      >(
        {
          householdId:
            "A settlement cannot be moved to another household.",
        },
        "Unable to update settlement."
      );
    }

    const accountErrors =
      this.validateAccountReferences(
        form
      );

    if (
      Object.keys(
        accountErrors
      ).length >
      0
    ) {
      return OperationResults.failure<
        Settlement
      >(
        accountErrors,
        "Please correct the settlement account errors."
      );
    }

    const updatedSettlement:
      Settlement = {
        ...existing,

        householdId:
          existing.householdId,

        fromMemberId:
          form.fromMemberId.trim(),

        toMemberId:
          form.toMemberId.trim(),

        amount:
          this.roundCurrency(
            form.amount
          ),

        settlementDate:
          new Date(
            `${form.settlementDate}T00:00:00`
          ),

        sourceAccountId:
          form.sourceAccountId
            .trim() ||
          undefined,

        destinationAccountId:
          form.destinationAccountId
            .trim() ||
          undefined,

        applicationMethod:
          form.applicationMethod,

        referenceNumber:
          form.referenceNumber
            .trim() ||
          undefined,

        notes:
          form.notes.trim() ||
          undefined,

        attachments:
          [],

        isActive:
          form.isActive,

        updatedAt:
          new Date(),
      };

    const existingApplications =
      SettlementApplicationRepository
        .findBySettlementId(
          existing.id
        );

    const applicationRemoval =
      this.removeApplications(
        existing.id,
        existingApplications
      );

    if (
      !applicationRemoval.success
    ) {
      return OperationResults.failure<
        Settlement
      >(
        applicationRemoval.errors,
        applicationRemoval.message ??
          "Unable to prepare the settlement update."
      );
    }

    const applicationResult =
      this.buildApplications(
        updatedSettlement,
        form
      );

    if (
      !applicationResult.success
    ) {
      const applicationRestoration =
        this.restoreApplications(
          existing.id,
          existingApplications
        );

      if (
        !applicationRestoration.success
      ) {
        return OperationResults.failure<
          Settlement
        >(
          {
            general:
              "The updated settlement applications were invalid and the original applications could not be restored.",
          },
          "Critical settlement application restoration failure."
        );
      }

      return OperationResults.failure<
        Settlement
      >(
        applicationResult.errors,
        applicationResult.message ??
          "Unable to prepare updated settlement applications."
      );
    }

    const reversalResult =
      this.reverseBalanceEffects(
        existing
      );

    if (!reversalResult.success) {
      const applicationRestoration =
        this.restoreApplications(
          existing.id,
          existingApplications
        );

      if (
        !applicationRestoration.success
      ) {
        return OperationResults.failure<
          Settlement
        >(
          {
            general:
              "The existing settlement could not be reversed and its applications could not be restored.",
          },
          "Critical settlement application restoration failure."
        );
      }

      return OperationResults.failure<
        Settlement
      >(
        reversalResult.errors,
        reversalResult.message ??
          "Unable to reverse the existing settlement."
      );
    }

    const applyResult =
      this.applyBalanceEffects(
        updatedSettlement
      );

    if (!applyResult.success) {
      const balanceRestoration =
        this.applyBalanceEffects(
          existing
        );

      const applicationRestoration =
        this.restoreApplications(
          existing.id,
          existingApplications
        );

      if (
        !balanceRestoration.success ||
        !applicationRestoration.success
      ) {
        return OperationResults.failure<
          Settlement
        >(
          {
            general:
              "The settlement update failed and the original settlement state could not be fully restored.",
          },
          "Critical settlement restoration failure."
        );
      }

      return OperationResults.failure<
        Settlement
      >(
        applyResult.errors,
        applyResult.message ??
          "Unable to apply the updated settlement."
      );
    }

    const savedSettlement =
      SettlementRepository.update(
        updatedSettlement
      );

    if (!savedSettlement) {
      const balanceRollback =
        this.rollbackUpdatedBalanceEffects(
          existing,
          updatedSettlement
        );

      const applicationRestoration =
        this.restoreApplications(
          existing.id,
          existingApplications
        );

      if (
        !balanceRollback.success ||
        !applicationRestoration.success
      ) {
        return OperationResults.failure<
          Settlement
        >(
          {
            general:
              "The updated settlement could not be saved and the original state could not be fully restored.",
          },
          "Critical settlement persistence rollback failure."
        );
      }

      return OperationResults.failure<
        Settlement
      >(
        {
          general:
            "Settlement could not be saved.",
        },
        "Unable to update settlement."
      );
    }

    const updatedApplications =
      applicationResult.data ?? [];

    const savedApplications =
      SettlementApplicationRepository
        .replaceBySettlementId(
          savedSettlement.id,
          updatedApplications
        );

    if (!savedApplications) {
      const settlementRestoration =
        SettlementRepository.update(
          existing
        );

      const balanceRollback =
        this.rollbackUpdatedBalanceEffects(
          existing,
          updatedSettlement
        );

      const applicationRestoration =
        this.restoreApplications(
          existing.id,
          existingApplications
        );

      if (
        !settlementRestoration ||
        !balanceRollback.success ||
        !applicationRestoration.success
      ) {
        return OperationResults.failure<
          Settlement
        >(
          {
            general:
              "The updated applications could not be saved and the original settlement state could not be fully restored.",
          },
          "Critical settlement persistence restoration failure."
        );
      }

      return OperationResults.failure<
        Settlement
      >(
        {
          applications:
            "Settlement applications could not be saved.",
        },
        "Unable to update settlement."
      );
    }

    return OperationResults.success(
      savedSettlement,
      "Settlement updated successfully."
    );
  }

  /**
   * Deletes a settlement, removes its applications,
   * and reverses optional account effects.
   */
  static delete(
    id: string
  ): OperationResult<boolean> {
    const existing =
      SettlementRepository.findById(
        id
      );

    if (!existing) {
      return OperationResults.failure<
        boolean
      >(
        {
          general:
            "Settlement not found.",
        },
        "Unable to delete settlement."
      );
    }

    const existingApplications =
      SettlementApplicationRepository
        .findBySettlementId(
          id
        );

    const reversalResult =
      this.reverseBalanceEffects(
        existing
      );

    if (!reversalResult.success) {
      return OperationResults.failure<
        boolean
      >(
        reversalResult.errors,
        reversalResult.message ??
          "Unable to reverse the settlement."
      );
    }

    const applicationRemoval =
      this.removeApplications(
        id,
        existingApplications
      );

    if (
      !applicationRemoval.success
    ) {
      const balanceRestoration =
        this.applyBalanceEffects(
          existing
        );

      if (!balanceRestoration.success) {
        return OperationResults.failure<
          boolean
        >(
          {
            general:
              "Settlement applications could not be deleted and account balances could not be restored.",
          },
          "Critical settlement restoration failure."
        );
      }

      return OperationResults.failure<
        boolean
      >(
        applicationRemoval.errors,
        applicationRemoval.message ??
          "Unable to delete settlement applications."
      );
    }

    const deleted =
      SettlementRepository.delete(
        id
      );

    if (!deleted) {
      const applicationRestoration =
        this.restoreApplications(
          id,
          existingApplications
        );

      const balanceRestoration =
        this.applyBalanceEffects(
          existing
        );

      if (
        !applicationRestoration.success ||
        !balanceRestoration.success
      ) {
        return OperationResults.failure<
          boolean
        >(
          {
            general:
              "The settlement could not be deleted and its original state could not be fully restored.",
          },
          "Critical settlement persistence restoration failure."
        );
      }

      return OperationResults.failure<
        boolean
      >(
        {
          general:
            "Settlement could not be deleted.",
        },
        "Delete failed."
      );
    }

    return OperationResults.success(
      true,
      "Settlement deleted successfully."
    );
  }

  /**
   * Builds oldest-first or manual applications
   * without persisting them.
   */
  private static buildApplications(
    settlement: Settlement,
    form: SettlementForm
  ): OperationResult<
    SettlementApplication[]
  > {
    if (
      settlement.applicationMethod ===
      "oldest-first"
    ) {
      return SettlementApplicationService
        .buildOldestFirstApplications(
          settlement.id,
          settlement.householdId,
          settlement.fromMemberId,
          settlement.toMemberId,
          settlement.amount
        );
    }

    return SettlementApplicationService
      .buildManualApplications(
        settlement.id,
        settlement.householdId,
        settlement.fromMemberId,
        settlement.toMemberId,
        settlement.amount,
        form.applications
      );
  }

  /**
   * Validates optional account references and
   * private-account ownership.
   */
  private static validateAccountReferences(
    form: SettlementForm
  ): Record<string, string> {
    const errors:
      Record<string, string> = {};

    const validateAccount = (
      accountId: string,
      field:
        | "sourceAccountId"
        | "destinationAccountId",
      requiredOwnerMemberId: string,
      label: string
    ): void => {
      const normalizedAccountId =
        accountId.trim();

      if (!normalizedAccountId) {
        return;
      }

      const account =
        AccountService.getAccountById(
          normalizedAccountId
        );

      if (!account) {
        errors[field] =
          `${label} account was not found.`;

        return;
      }

      if (
        account.householdId !==
        form.householdId.trim()
      ) {
        errors[field] =
          `${label} account does not belong to this household.`;

        return;
      }

      if (!account.isActive) {
        errors[field] =
          `${label} account is inactive.`;

        return;
      }

      if (
        account.visibility ===
          "private" &&
        (
          !account.ownerMemberId ||
          account.ownerMemberId !==
            requiredOwnerMemberId.trim()
        )
      ) {
        errors[field] =
          `Only the appropriate settlement member may use this private ${label.toLowerCase()} account.`;
      }
    };

    validateAccount(
      form.sourceAccountId,
      "sourceAccountId",
      form.fromMemberId,
      "Source"
    );

    validateAccount(
      form.destinationAccountId,
      "destinationAccountId",
      form.toMemberId,
      "Destination"
    );

    return errors;
  }

  /**
   * Removes existing applications when preparing
   * an update or deletion.
   */
  private static removeApplications(
    settlementId: string,
    applications:
      SettlementApplication[]
  ): OperationResult<boolean> {
    if (
      applications.length === 0
    ) {
      return OperationResults.success(
        true
      );
    }

    const deleted =
      SettlementApplicationRepository
        .deleteBySettlementId(
          settlementId
        );

    if (!deleted) {
      return OperationResults.failure<
        boolean
      >(
        {
          applications:
            "Settlement applications could not be removed.",
        },
        "Unable to remove settlement applications."
      );
    }

    return OperationResults.success(
      true
    );
  }

  /**
   * Restores an earlier application collection.
   */
  private static restoreApplications(
    settlementId: string,
    applications:
      SettlementApplication[]
  ): OperationResult<boolean> {
    const restored =
      SettlementApplicationRepository
        .replaceBySettlementId(
          settlementId,
          applications
        );

    if (!restored) {
      return OperationResults.failure<
        boolean
      >(
        {
          applications:
            "The original settlement applications could not be restored.",
        },
        "Unable to restore settlement applications."
      );
    }

    return OperationResults.success(
      true
    );
  }

  /**
   * Applies optional settlement account effects.
   *
   * A settlement remains separate from transaction
   * income and expense calculations.
   */
  private static applyBalanceEffects(
    settlement: Settlement
  ): OperationResult<boolean> {
    if (!settlement.isActive) {
      return OperationResults.success(
        true
      );
    }

    const operations =
      this.buildAccountOperations(
        settlement,
        false
      );

    return this.executeAccountOperations(
      operations
    );
  }

  /**
   * Reverses optional settlement account effects.
   */
  private static reverseBalanceEffects(
    settlement: Settlement
  ): OperationResult<boolean> {
    if (!settlement.isActive) {
      return OperationResults.success(
        true
      );
    }

    const operations =
      this.buildAccountOperations(
        settlement,
        true
      );

    return this.executeAccountOperations(
      operations
    );
  }

  /**
   * Reverses updated effects and restores
   * the original settlement effects.
   */
  private static rollbackUpdatedBalanceEffects(
    existing: Settlement,
    updated: Settlement
  ): OperationResult<boolean> {
    const updatedReversal =
      this.reverseBalanceEffects(
        updated
      );

    if (!updatedReversal.success) {
      return OperationResults.failure<
        boolean
      >(
        updatedReversal.errors,
        "Unable to reverse the updated settlement effects."
      );
    }

    const originalRestoration =
      this.applyBalanceEffects(
        existing
      );

    if (!originalRestoration.success) {
      return OperationResults.failure<
        boolean
      >(
        originalRestoration.errors,
        "Unable to restore the original settlement effects."
      );
    }

    return OperationResults.success(
      true
    );
  }

  /**
   * Builds account operations for a reimbursement.
   *
   * Applying:
   * - Credit source account
   * - Debit destination account
   *
   * Reversing performs the inverse operations
   * in reverse order.
   */
  private static buildAccountOperations(
    settlement: Settlement,
    reverse: boolean
  ): AccountOperation[] {
    const operations:
      AccountOperation[] = [];

    if (reverse) {
      if (
        settlement.destinationAccountId
      ) {
        operations.push({
          accountId:
            settlement.destinationAccountId,

          type:
            "credit",

          amount:
            settlement.amount,
        });
      }

      if (
        settlement.sourceAccountId
      ) {
        operations.push({
          accountId:
            settlement.sourceAccountId,

          type:
            "debit",

          amount:
            settlement.amount,
        });
      }

      return operations;
    }

    if (
      settlement.sourceAccountId
    ) {
      operations.push({
        accountId:
          settlement.sourceAccountId,

        type:
          "credit",

        amount:
          settlement.amount,
      });
    }

    if (
      settlement.destinationAccountId
    ) {
      operations.push({
        accountId:
          settlement.destinationAccountId,

        type:
          "debit",

        amount:
          settlement.amount,
      });
    }

    return operations;
  }

  /**
   * Executes account operations sequentially
   * and rolls back completed operations on failure.
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
                "The settlement failed and completed account operations could not be fully rolled back.",
            },
            "Critical settlement account rollback failure."
          );
        }

        return OperationResults.failure<
          boolean
        >(
          result.errors,
          result.message ??
            "Unable to update a settlement account balance."
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
   * Executes one account debit or credit.
   */
  private static executeAccountOperation(
    operation: AccountOperation
  ) {
    if (
      operation.type ===
      "debit"
    ) {
      return AccountService
        .debitAccount(
          operation.accountId,
          operation.amount
        );
    }

    return AccountService
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
            "Unable to roll back a settlement account operation."
        );
      }
    }

    return OperationResults.success(
      true
    );
  }

  /**
   * Normalizes monetary values to cents.
   */
  private static roundCurrency(
    amount: number
  ): number {
    return (
      Math.round(
        amount * 100
      ) /
      100
    );
  }
}
