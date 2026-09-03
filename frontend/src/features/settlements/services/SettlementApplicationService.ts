import type { ExpenseAllocation } from "../../transactions/models/ExpenseAllocation";

import type { SettlementApplication } from "../models/SettlementApplication";

import type { SettlementApplicationForm } from "../models/SettlementApplicationForm";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import TransactionRepository from "../../transactions/repositories/TransactionRepository";

import ExpenseAllocationRepository from "../../transactions/repositories/ExpenseAllocationRepository";

import AllocationPaymentService from "./AllocationPaymentService";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types/index";

interface EligibleOutstandingAllocation {
  allocation: ExpenseAllocation;
  transactionDate: Date;
  outstandingAmount: number;
}

export default class SettlementApplicationService {
  /**
   * Builds settlement applications by applying payment
   * to the oldest eligible allocations first.
   *
   * Applications are returned without being persisted.
   */
  static buildOldestFirstApplications(
    settlementId: string,
    householdId: string,
    fromMemberId: string,
    toMemberId: string,
    settlementAmount: number
  ): OperationResult<SettlementApplication[]> {
    const requestValidation =
      this.validateApplicationRequest(
        settlementId,
        householdId,
        fromMemberId,
        toMemberId,
        settlementAmount
      );

    if (!requestValidation.success) {
      return OperationResults.failure<
        SettlementApplication[]
      >(
        requestValidation.errors,
        requestValidation.message ??
          "Unable to build settlement applications."
      );
    }

    const eligibleAllocations =
      this.getEligibleOutstandingAllocations(
        householdId,
        fromMemberId,
        toMemberId
      );

    if (eligibleAllocations.length === 0) {
      return OperationResults.failure<
        SettlementApplication[]
      >(
        {
          applications:
            "No outstanding allocations were found between these members.",
        },
        "Unable to apply the settlement."
      );
    }

    const settlementCents =
      this.toCents(settlementAmount);

    const totalOutstandingCents =
      eligibleAllocations.reduce(
        (total, item) =>
          total +
          this.toCents(
            item.outstandingAmount
          ),
        0
      );

    if (
      settlementCents >
      totalOutstandingCents
    ) {
      return OperationResults.failure<
        SettlementApplication[]
      >(
        {
          amount:
            "Settlement amount cannot exceed the outstanding balance between these members.",
        },
        "Unable to apply the settlement."
      );
    }

    let remainingCents =
      settlementCents;

    const now = new Date();

    const applications:
      SettlementApplication[] = [];

    for (
      const item of eligibleAllocations
    ) {
      if (remainingCents <= 0) {
        break;
      }

      const outstandingCents =
        this.toCents(
          item.outstandingAmount
        );

      const appliedCents =
        Math.min(
          remainingCents,
          outstandingCents
        );

      if (appliedCents <= 0) {
        continue;
      }

      applications.push({
        id: crypto.randomUUID(),

        settlementId,

        expenseAllocationId:
          item.allocation.id,

        appliedAmount:
          this.fromCents(
            appliedCents
          ),

        createdAt: now,
        updatedAt: now,
      });

      remainingCents -=
        appliedCents;
    }

    if (remainingCents !== 0) {
      return OperationResults.failure<
        SettlementApplication[]
      >(
        {
          applications:
            "The complete settlement amount could not be applied.",
        },
        "Unable to apply the settlement."
      );
    }

    return OperationResults.success(
      applications,
      "Oldest outstanding allocations were selected successfully."
    );
  }

  /**
   * Builds settlement applications from manually
   * selected expense allocations.
   *
   * Applications are returned without being persisted.
   */
  static buildManualApplications(
    settlementId: string,
    householdId: string,
    fromMemberId: string,
    toMemberId: string,
    settlementAmount: number,
    forms: SettlementApplicationForm[]
  ): OperationResult<SettlementApplication[]> {
    const requestValidation =
      this.validateApplicationRequest(
        settlementId,
        householdId,
        fromMemberId,
        toMemberId,
        settlementAmount
      );

    if (!requestValidation.success) {
      return OperationResults.failure<
        SettlementApplication[]
      >(
        requestValidation.errors,
        requestValidation.message ??
          "Unable to build settlement applications."
      );
    }

    if (forms.length === 0) {
      return OperationResults.failure<
        SettlementApplication[]
      >(
        {
          applications:
            "Select at least one expense allocation.",
        },
        "Unable to apply the settlement."
      );
    }

    const formValidation =
      this.validateManualForms(
        forms,
        settlementAmount
      );

    if (!formValidation.success) {
      return OperationResults.failure<
        SettlementApplication[]
      >(
        formValidation.errors,
        formValidation.message ??
          "Invalid manual settlement applications."
      );
    }

    const selectedForms =
      forms.filter(
        (form) =>
          form.isSelected
      );

    const now = new Date();

    const applications:
      SettlementApplication[] = [];

    for (const form of selectedForms) {
      const allocation =
        ExpenseAllocationRepository.findById(
          form.expenseAllocationId.trim()
        );

      const eligibilityValidation =
        this.validateAllocationEligibility(
          allocation,
          householdId,
          fromMemberId,
          toMemberId
        );

      if (!eligibilityValidation.success) {
        return OperationResults.failure<
          SettlementApplication[]
        >(
          eligibilityValidation.errors,
          eligibilityValidation.message ??
            "Invalid settlement allocation."
        );
      }

      if (!allocation) {
        return OperationResults.failure<
          SettlementApplication[]
        >(
          {
            applications:
              "An expense allocation was not found.",
          },
          "Unable to apply the settlement."
        );
      }

      const outstandingAmount =
        AllocationPaymentService.getOutstandingAmount(
          allocation
        );

      const appliedCents =
        this.toCents(
          form.appliedAmount
        );

      const outstandingCents =
        this.toCents(
          outstandingAmount
        );

      if (appliedCents > outstandingCents) {
        return OperationResults.failure<
          SettlementApplication[]
        >(
          {
            applications:
              "An applied amount cannot exceed the allocation's outstanding amount.",
          },
          "Unable to apply the settlement."
        );
      }

      applications.push({
        id: crypto.randomUUID(),

        settlementId,

        expenseAllocationId:
          allocation.id,

        appliedAmount:
          this.fromCents(
            appliedCents
          ),

        createdAt: now,
        updatedAt: now,
      });
    }

    return OperationResults.success(
      applications,
      "Manual settlement applications were prepared successfully."
    );
  }

  /**
   * Returns eligible outstanding allocations ordered
   * from oldest to newest.
   */
  private static getEligibleOutstandingAllocations(
    householdId: string,
    fromMemberId: string,
    toMemberId: string
  ): EligibleOutstandingAllocation[] {
    return ExpenseAllocationRepository
      .findByMemberId(fromMemberId)
      .filter(
        (allocation) =>
          allocation.paidByMemberId ===
            toMemberId &&
          allocation.isIncluded &&
          allocation.allocatedAmount > 0 &&
          allocation.memberId !==
            allocation.paidByMemberId
      )
      .map((allocation) => {
        const transaction =
          TransactionRepository.findById(
            allocation.transactionId
          );

        if (
          !transaction ||
          transaction.householdId !==
            householdId ||
          transaction.type !==
            "expense" ||
          !transaction.isActive
        ) {
          return undefined;
        }

        const outstandingAmount =
          AllocationPaymentService.getOutstandingAmount(
            allocation
          );

        if (outstandingAmount <= 0) {
          return undefined;
        }

        return {
          allocation,
          transactionDate:
            transaction.transactionDate,
          outstandingAmount,
        };
      })
      .filter(
        (
          item
        ): item is EligibleOutstandingAllocation =>
          item !== undefined
      )
      .sort((first, second) => {
        const transactionDateDifference =
          first.transactionDate.getTime() -
          second.transactionDate.getTime();

        if (
          transactionDateDifference !== 0
        ) {
          return transactionDateDifference;
        }

        const allocationDateDifference =
          first.allocation.createdAt.getTime() -
          second.allocation.createdAt.getTime();

        if (
          allocationDateDifference !== 0
        ) {
          return allocationDateDifference;
        }

        return first.allocation.id.localeCompare(
          second.allocation.id
        );
      });
  }

  /**
   * Validates the settlement and member information
   * required by both application methods.
   */
  private static validateApplicationRequest(
    settlementId: string,
    householdId: string,
    fromMemberId: string,
    toMemberId: string,
    settlementAmount: number
  ): OperationResult<boolean> {
    if (!settlementId.trim()) {
      return OperationResults.failure<boolean>(
        {
          settlementId:
            "Settlement ID is required.",
        },
        "Unable to build settlement applications."
      );
    }

    if (!householdId.trim()) {
      return OperationResults.failure<boolean>(
        {
          householdId:
            "Household is required.",
        },
        "Unable to build settlement applications."
      );
    }

    if (!fromMemberId.trim()) {
      return OperationResults.failure<boolean>(
        {
          fromMemberId:
            "Select the member making the payment.",
        },
        "Unable to build settlement applications."
      );
    }

    if (!toMemberId.trim()) {
      return OperationResults.failure<boolean>(
        {
          toMemberId:
            "Select the member receiving the payment.",
        },
        "Unable to build settlement applications."
      );
    }

    if (
      fromMemberId.trim() ===
      toMemberId.trim()
    ) {
      return OperationResults.failure<boolean>(
        {
          toMemberId:
            "A member cannot make a settlement payment to themselves.",
        },
        "Unable to build settlement applications."
      );
    }

    if (
      !Number.isFinite(
        settlementAmount
      ) ||
      settlementAmount <= 0
    ) {
      return OperationResults.failure<boolean>(
        {
          amount:
            "Settlement amount must be greater than zero.",
        },
        "Unable to build settlement applications."
      );
    }

    const fromMember =
      HouseholdMemberService.getMemberById(
        fromMemberId.trim()
      );

    if (
      !fromMember ||
      !fromMember.isActive ||
      fromMember.householdId !==
        householdId
    ) {
      return OperationResults.failure<boolean>(
        {
          fromMemberId:
            "The paying member must be active and belong to this household.",
        },
        "Unable to build settlement applications."
      );
    }

    const toMember =
      HouseholdMemberService.getMemberById(
        toMemberId.trim()
      );

    if (
      !toMember ||
      !toMember.isActive ||
      toMember.householdId !==
        householdId
    ) {
      return OperationResults.failure<boolean>(
        {
          toMemberId:
            "The receiving member must be active and belong to this household.",
        },
        "Unable to build settlement applications."
      );
    }

    return OperationResults.success(true);
  }

  /**
   * Validates manual form IDs, selections,
   * amounts, uniqueness, and total.
   */
  private static validateManualForms(
    forms: SettlementApplicationForm[],
    settlementAmount: number
  ): OperationResult<boolean> {
    const allocationIds =
      new Set<string>();

    let selectedCount = 0;
    let appliedTotalCents = 0;

    for (const form of forms) {
      const expenseAllocationId =
        form.expenseAllocationId.trim();

      if (!expenseAllocationId) {
        return OperationResults.failure<boolean>(
          {
            applications:
              "Every settlement application must reference an expense allocation.",
          },
          "Unable to validate manual settlement applications."
        );
      }

      if (
        allocationIds.has(
          expenseAllocationId
        )
      ) {
        return OperationResults.failure<boolean>(
          {
            applications:
              "An expense allocation cannot appear more than once in a settlement.",
          },
          "Unable to validate manual settlement applications."
        );
      }

      allocationIds.add(
        expenseAllocationId
      );

      if (!form.isSelected) {
        if (form.appliedAmount !== 0) {
          return OperationResults.failure<boolean>(
            {
              applications:
                "Unselected expense allocations must have a zero applied amount.",
            },
            "Unable to validate manual settlement applications."
          );
        }

        continue;
      }

      selectedCount += 1;

      if (
        !Number.isFinite(
          form.appliedAmount
        ) ||
        form.appliedAmount <= 0
      ) {
        return OperationResults.failure<boolean>(
          {
            applications:
              "Every selected allocation must have an applied amount greater than zero.",
          },
          "Unable to validate manual settlement applications."
        );
      }

      appliedTotalCents +=
        this.toCents(
          form.appliedAmount
        );
    }

    if (selectedCount === 0) {
      return OperationResults.failure<boolean>(
        {
          applications:
            "Select at least one expense allocation.",
        },
        "Unable to validate manual settlement applications."
      );
    }

    if (
      appliedTotalCents >
      this.toCents(settlementAmount)
    ) {
      return OperationResults.failure<boolean>(
        {
          applications:
            "Manual application amounts cannot exceed the settlement amount.",
        },
        "Unable to validate manual settlement applications."
      );
    }

    return OperationResults.success(true);
  }

  /**
   * Ensures one manual allocation belongs to the
   * correct household, debtor, and creditor.
   */
  private static validateAllocationEligibility(
    allocation:
      | ExpenseAllocation
      | undefined,
    householdId: string,
    fromMemberId: string,
    toMemberId: string
  ): OperationResult<boolean> {
    if (!allocation) {
      return OperationResults.failure<boolean>(
        {
          applications:
            "An expense allocation was not found.",
        },
        "Unable to validate settlement allocation."
      );
    }

    if (
      !allocation.isIncluded ||
      allocation.allocatedAmount <= 0
    ) {
      return OperationResults.failure<boolean>(
        {
          applications:
            "Settlement applications must reference an included expense allocation.",
        },
        "Unable to validate settlement allocation."
      );
    }

    if (
      allocation.memberId ===
      allocation.paidByMemberId
    ) {
      return OperationResults.failure<boolean>(
        {
          applications:
            "A payer's own allocation cannot receive a settlement application.",
        },
        "Unable to validate settlement allocation."
      );
    }

    if (
      allocation.memberId !==
      fromMemberId
    ) {
      return OperationResults.failure<boolean>(
        {
          applications:
            "The selected allocation does not belong to the paying member.",
        },
        "Unable to validate settlement allocation."
      );
    }

    if (
      allocation.paidByMemberId !==
      toMemberId
    ) {
      return OperationResults.failure<boolean>(
        {
          applications:
            "The selected allocation is owed to another household member.",
        },
        "Unable to validate settlement allocation."
      );
    }

    const transaction =
      TransactionRepository.findById(
        allocation.transactionId
      );

    if (
      !transaction ||
      transaction.householdId !==
        householdId ||
      transaction.type !==
        "expense" ||
      !transaction.isActive
    ) {
      return OperationResults.failure<boolean>(
        {
          applications:
            "The selected allocation must belong to an active household expense.",
        },
        "Unable to validate settlement allocation."
      );
    }

    const outstandingAmount =
      AllocationPaymentService.getOutstandingAmount(
        allocation
      );

    if (outstandingAmount <= 0) {
      return OperationResults.failure<boolean>(
        {
          applications:
            "The selected expense allocation has already been paid.",
        },
        "Unable to validate settlement allocation."
      );
    }

    return OperationResults.success(true);
  }

  /**
   * Converts currency to integer cents.
   */
  private static toCents(
    amount: number
  ): number {
    return Math.round(
      amount * 100
    );
  }

  /**
   * Converts integer cents to currency.
   */
  private static fromCents(
    amount: number
  ): number {
    return amount / 100;
  }
}
