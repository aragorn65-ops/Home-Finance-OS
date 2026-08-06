import type {
  ExpenseAllocation,
  ExpenseSplitMethod,
} from "../models/ExpenseAllocation";

import type { ExpenseAllocationForm } from "../models/ExpenseAllocationForm";

import ExpenseAllocationRepository from "../repositories/ExpenseAllocationRepository";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import SharedPersonalAllocationService from "./SharedPersonalAllocationService";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types/index";

export default class ExpenseAllocationService {
  /**
   * Returns all stored expense allocations.
   */
  static getAllocations(): ExpenseAllocation[] {
    return ExpenseAllocationRepository.findAll();
  }

  /**
   * Returns allocations belonging to one transaction.
   */
  static getByTransactionId(
    transactionId: string
  ): ExpenseAllocation[] {
    return ExpenseAllocationRepository
      .findByTransactionId(
        transactionId
      );
  }

  /**
   * Returns allocations assigned to one member.
   */
  static getByMemberId(
    memberId: string
  ): ExpenseAllocation[] {
    return ExpenseAllocationRepository
      .findByMemberId(
        memberId
      );
  }

  /**
   * Creates allocations for a new expense transaction.
   */
  static createForTransaction(
    transactionId: string,
    householdId: string,
    paidByMemberId: string,
    splitMethod: ExpenseSplitMethod,
    transactionAmount: number,
    forms: ExpenseAllocationForm[]
  ): OperationResult<ExpenseAllocation[]> {
    const buildResult =
      this.buildAllocations(
        transactionId,
        householdId,
        paidByMemberId,
        splitMethod,
        transactionAmount,
        forms,
        {
          requireActiveMembers: true,
        }
      );

    if (!buildResult.success) {
      return OperationResults.failure<
        ExpenseAllocation[]
      >(
        buildResult.errors,
        buildResult.message ??
          "Unable to create expense allocations."
      );
    }

    const allocations =
      buildResult.data ?? [];

    if (
      allocations.length === 0
    ) {
      return OperationResults.success(
        [],
        "No expense allocations were required."
      );
    }

    const createdAllocations =
      ExpenseAllocationRepository
        .createMany(
          allocations
        );

    if (!createdAllocations) {
      return OperationResults.failure<
        ExpenseAllocation[]
      >(
        {
          allocations:
            "Expense allocations could not be saved.",
        },
        "Unable to create expense allocations."
      );
    }

    return OperationResults.success(
      createdAllocations,
      "Expense allocations created successfully."
    );
  }

  /**
   * Replaces allocations when an expense is edited.
   */
  static replaceForTransaction(
    transactionId: string,
    householdId: string,
    paidByMemberId: string,
    splitMethod: ExpenseSplitMethod,
    transactionAmount: number,
    forms: ExpenseAllocationForm[]
  ): OperationResult<ExpenseAllocation[]> {
    const buildResult =
      this.buildAllocations(
        transactionId,
        householdId,
        paidByMemberId,
        splitMethod,
        transactionAmount,
        forms,
        {
          requireActiveMembers: false,
        }
      );

    if (!buildResult.success) {
      return OperationResults.failure<
        ExpenseAllocation[]
      >(
        buildResult.errors,
        buildResult.message ??
          "Unable to update expense allocations."
      );
    }

    const allocations =
      buildResult.data ?? [];

    const savedAllocations =
      ExpenseAllocationRepository
        .replaceByTransactionId(
          transactionId,
          allocations
        );

    if (!savedAllocations) {
      return OperationResults.failure<
        ExpenseAllocation[]
      >(
        {
          allocations:
            "Expense allocations could not be saved.",
        },
        "Unable to update expense allocations."
      );
    }

    return OperationResults.success(
      savedAllocations,
      "Expense allocations updated successfully."
    );
  }

  /**
   * Deletes allocations belonging to a transaction.
   */
  static deleteForTransaction(
    transactionId: string
  ): OperationResult<boolean> {
    const existing =
      ExpenseAllocationRepository
        .findByTransactionId(
          transactionId
        );

    if (
      existing.length === 0
    ) {
      return OperationResults.success(
        true,
        "No expense allocations required deletion."
      );
    }

    const deleted =
      ExpenseAllocationRepository
        .deleteByTransactionId(
          transactionId
        );

    if (!deleted) {
      return OperationResults.failure<
        boolean
      >(
        {
          allocations:
            "Expense allocations could not be deleted.",
        },
        "Unable to delete expense allocations."
      );
    }

    return OperationResults.success(
      true,
      "Expense allocations deleted successfully."
    );
  }

  /**
   * Builds validated allocation records without saving.
   */
  private static buildAllocations(
    transactionId: string,
    householdId: string,
    paidByMemberId: string,
    splitMethod: ExpenseSplitMethod,
    transactionAmount: number,
    forms: ExpenseAllocationForm[],
    options: {
      requireActiveMembers: boolean;
    }
  ): OperationResult<ExpenseAllocation[]> {
    if (
      !transactionId.trim()
    ) {
      return OperationResults.failure<
        ExpenseAllocation[]
      >(
        {
          transactionId:
            "Transaction ID is required.",
        },
        "Unable to build expense allocations."
      );
    }

    if (
      !Number.isFinite(
        transactionAmount
      ) ||
      transactionAmount <= 0
    ) {
      return OperationResults.failure<
        ExpenseAllocation[]
      >(
        {
          amount:
            "Expense amount must be greater than zero.",
        },
        "Unable to build expense allocations."
      );
    }

    if (
      splitMethod ===
      "none"
    ) {
      if (
        forms.length > 0
      ) {
        return OperationResults.failure<
          ExpenseAllocation[]
        >(
          {
            allocations:
              "Individual expenses cannot contain member allocations.",
          },
          "Unable to build expense allocations."
        );
      }

      return OperationResults.success(
        []
      );
    }

    const memberValidation =
      this.validateMembers(
        householdId,
        paidByMemberId,
        forms,
        options
      );

    if (
      !memberValidation.success
    ) {
      return OperationResults.failure<
        ExpenseAllocation[]
      >(
        memberValidation.errors,
        memberValidation.message ??
          "Invalid household member allocation."
      );
    }

    const includedForms =
      forms.filter(
        (form) =>
          form.isIncluded
      );

    if (
      includedForms.length === 0
    ) {
      return OperationResults.failure<
        ExpenseAllocation[]
      >(
        {
          allocations:
            "At least one member must participate in the expense.",
        },
        "Unable to build expense allocations."
      );
    }

    let calculatedAmounts:
      OperationResult<number[]>;

    switch (splitMethod) {
      case "equal":
        calculatedAmounts =
          this.calculateEqualAmounts(
            transactionAmount,
            forms
          );
        break;

      case "shared-personal":
        calculatedAmounts =
          this.calculateSharedPersonalAmounts(
            transactionAmount,
            forms
          );
        break;

      case "exact":
      case "submeter":
        calculatedAmounts =
          this.calculateEnteredAmounts(
            transactionAmount,
            forms
          );
        break;

      default:
        return OperationResults.failure<
          ExpenseAllocation[]
        >(
          {
            splitMethod:
              "Unsupported expense split method.",
          },
          "Unable to calculate expense allocations."
        );
    }

    if (
      !calculatedAmounts.success
    ) {
      return OperationResults.failure<
        ExpenseAllocation[]
      >(
        calculatedAmounts.errors,
        calculatedAmounts.message ??
          "Unable to calculate expense allocations."
      );
    }

    const amounts =
      calculatedAmounts.data ?? [];

    const now =
      new Date();

    const allocations =
      forms.map(
        (
          form,
          index
        ): ExpenseAllocation => ({
          id:
            crypto.randomUUID(),

          transactionId,

          paidByMemberId,

          memberId:
            form.memberId.trim(),

          isIncluded:
            form.isIncluded,

          allocatedAmount:
            form.isIncluded
              ? amounts[index] ?? 0
              : 0,

          personalAmount:
            splitMethod ===
              "shared-personal" &&
            form.isIncluded
              ? form.personalAmount
              : undefined,

          personalItems:
            splitMethod ===
              "shared-personal" &&
            form.isIncluded
              ? form.personalItems.map(
                  (item) => ({
                    ...item,
                  })
                )
              : undefined,

          notes:
            form.notes.trim() ||
            undefined,

          createdAt:
            now,

          updatedAt:
            now,
        })
      );

    return OperationResults.success(
      allocations
    );
  }

  /**
   * Validates the payer and allocation members.
   */
  private static validateMembers(
    householdId: string,
    paidByMemberId: string,
    forms: ExpenseAllocationForm[],
    options: {
      requireActiveMembers: boolean;
    }
  ): OperationResult<boolean> {
    const payer =
      HouseholdMemberService
        .getMemberById(
          paidByMemberId.trim()
        );

    if (!payer) {
      return OperationResults.failure<
        boolean
      >(
        {
          paidByMemberId:
            "The member who paid the expense was not found.",
        },
        "Unable to validate the expense payer."
      );
    }

    if (
      payer.householdId !==
        householdId ||
      (
        options.requireActiveMembers &&
        !payer.isActive
      )
    ) {
      return OperationResults.failure<
        boolean
      >(
        {
          paidByMemberId:
            options.requireActiveMembers
              ? "The expense payer is not an active member of this household."
              : "The expense payer does not belong to this household.",
        },
        "Unable to validate the expense payer."
      );
    }

    if (
      forms.length === 0
    ) {
      return OperationResults.failure<
        boolean
      >(
        {
          allocations:
            "Add at least one member to the expense split.",
        },
        "Unable to validate expense allocations."
      );
    }

    const memberIds =
      new Set<string>();

    for (
      const form of forms
    ) {
      const memberId =
        form.memberId.trim();

      if (!memberId) {
        return OperationResults.failure<
          boolean
        >(
          {
            allocations:
              "Every allocation must reference a household member.",
          },
          "Unable to validate expense allocations."
        );
      }

      if (
        memberIds.has(
          memberId
        )
      ) {
        return OperationResults.failure<
          boolean
        >(
          {
            allocations:
              "A member cannot appear more than once in an expense split.",
          },
          "Unable to validate expense allocations."
        );
      }

      memberIds.add(
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
        (
          options.requireActiveMembers &&
          !member.isActive
        )
      ) {
        return OperationResults.failure<
          boolean
        >(
          {
            allocations:
              options.requireActiveMembers
                ? "Every allocation member must be active and belong to the household."
                : "Every allocation member must belong to the household.",
          },
          "Unable to validate expense allocations."
        );
      }

      if (
        !form.isIncluded &&
        (
          form.allocatedAmount !==
            0 ||
          form.personalAmount !==
            0 ||
          form.personalItems.length >
            0
        )
      ) {
        return OperationResults.failure<
          boolean
        >(
          {
            allocations:
              "Opted-out members must have zero allocations and no personal items.",
          },
          "Unable to validate expense allocations."
        );
      }
    }

    return OperationResults.success(
      true
    );
  }

  /**
   * Calculates equal shares using cent-level precision.
   *
   * Any rounding remainder is assigned to the final
   * included member so the total always matches.
   */
  private static calculateEqualAmounts(
    transactionAmount: number,
    forms: ExpenseAllocationForm[]
  ): OperationResult<number[]> {
    const includedIndexes =
      forms
        .map(
          (
            form,
            index
          ) => ({
            form,
            index,
          })
        )
        .filter(
          ({ form }) =>
            form.isIncluded
        )
        .map(
          ({ index }) =>
            index
        );

    if (
      includedIndexes.length ===
      0
    ) {
      return OperationResults.failure<
        number[]
      >(
        {
          allocations:
            "At least one member must participate in the expense.",
        },
        "Unable to calculate equal allocations."
      );
    }

    const totalCents =
      Math.round(
        transactionAmount *
          100
      );

    const baseShareCents =
      Math.floor(
        totalCents /
          includedIndexes.length
      );

    const remainderCents =
      totalCents -
      baseShareCents *
        includedIndexes.length;

    const amounts =
      forms.map(
        () => 0
      );

    includedIndexes.forEach(
      (
        formIndex,
        includedIndex
      ) => {
        const isLastIncluded =
          includedIndex ===
          includedIndexes.length -
            1;

        const shareCents =
          baseShareCents +
          (
            isLastIncluded
              ? remainderCents
              : 0
          );

        amounts[formIndex] =
          shareCents /
          100;
      }
    );

    return OperationResults.success(
      amounts
    );
  }

  /**
   * Calculates the common amount after subtracting
   * personal items and divides it equally among
   * participating members.
   */
  private static calculateSharedPersonalAmounts(
    transactionAmount: number,
    forms: ExpenseAllocationForm[]
  ): OperationResult<number[]> {
    const calculationResult =
      SharedPersonalAllocationService
        .calculate(
          transactionAmount,

          forms.map(
            (form) => ({
              memberId:
                form.memberId,

              isIncluded:
                form.isIncluded,

              personalAmount:
                form.personalAmount,
            })
          )
        );

    if (
      !calculationResult.success
    ) {
      return OperationResults.failure<
        number[]
      >(
        calculationResult.errors,
        calculationResult.message ??
          "Unable to calculate shared and personal allocations."
      );
    }

    const calculation =
      calculationResult.data;

    if (!calculation) {
      return OperationResults.failure<
        number[]
      >(
        {
          allocations:
            "The shared and personal allocation calculation returned no result.",
        },
        "Unable to calculate shared and personal allocations."
      );
    }

    return OperationResults.success(
      calculation.allocations.map(
        (allocation) =>
          allocation.allocatedAmount
      )
    );
  }

  /**
   * Uses entered amounts for exact and
   * utility-precalculated allocations.
   */
  private static calculateEnteredAmounts(
    transactionAmount: number,
    forms: ExpenseAllocationForm[]
  ): OperationResult<number[]> {
    const amounts =
      forms.map(
        (form) => {
          if (
            !form.isIncluded
          ) {
            return 0;
          }

          return form.allocatedAmount;
        }
      );

    const hasInvalidAmount =
      amounts.some(
        (amount) =>
          !Number.isFinite(
            amount
          ) ||
          amount < 0
      );

    if (hasInvalidAmount) {
      return OperationResults.failure<
        number[]
      >(
        {
          allocations:
            "Every included member must have a valid non-negative allocation.",
        },
        "Unable to calculate expense allocations."
      );
    }

    const totalCents =
      amounts.reduce(
        (
          total,
          amount
        ) =>
          total +
          Math.round(
            amount *
              100
          ),
        0
      );

    const transactionCents =
      Math.round(
        transactionAmount *
          100
      );

    if (
      totalCents !==
      transactionCents
    ) {
      return OperationResults.failure<
        number[]
      >(
        {
          allocations:
            "Member allocations must equal the total expense amount.",
        },
        "Unable to calculate expense allocations."
      );
    }

    return OperationResults.success(
      amounts
    );
  }
}
