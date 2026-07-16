import type { ExpenseAllocation } from "../../transactions/models/ExpenseAllocation";

import type { SettlementAllocationOption } from "../models/SettlementAllocationOption";

import SettlementApplicationRepository from "../repositories/SettlementApplicationRepository";

import TransactionRepository from "../../transactions/repositories/TransactionRepository";

import ExpenseAllocationRepository from "../../transactions/repositories/ExpenseAllocationRepository";

import AllocationPaymentService from "./AllocationPaymentService";

export default class SettlementAllocationService {
  /**
   * Returns all outstanding settlement allocation
   * options belonging to a household.
   */
  static getOutstandingAllocations(
    householdId: string
  ): SettlementAllocationOption[] {
    if (!householdId.trim()) {
      return [];
    }

    return ExpenseAllocationRepository
      .findAll()
      .map((allocation) =>
        this.buildOption(
          allocation,
          householdId
        )
      )
      .filter(
        (
          option
        ): option is SettlementAllocationOption =>
          option !== undefined
      )
      .sort(
        this.compareOldestFirst
      );
  }

  /**
   * Returns allocation options for editing an existing
   * settlement.
   *
   * Applications belonging to the settlement being edited
   * are temporarily added back to the available outstanding
   * amount so its original allocations remain selectable.
   */
  static getAllocationsForSettlementEdit(
    householdId: string,
    settlementId: string
  ): SettlementAllocationOption[] {
    if (
      !householdId.trim() ||
      !settlementId.trim()
    ) {
      return [];
    }

    const settlementApplications =
      SettlementApplicationRepository
        .findBySettlementId(
          settlementId
        );

    const appliedAmountByAllocationId =
      new Map<string, number>();

    for (
      const application of
      settlementApplications
    ) {
      const currentAppliedAmount =
        appliedAmountByAllocationId.get(
          application.expenseAllocationId
        ) ?? 0;

      appliedAmountByAllocationId.set(
        application.expenseAllocationId,
        this.roundCurrency(
          currentAppliedAmount +
            application.appliedAmount
        )
      );
    }

    return ExpenseAllocationRepository
      .findAll()
      .map((allocation) =>
        this.buildEditOption(
          allocation,
          householdId,
          appliedAmountByAllocationId.get(
            allocation.id
          ) ?? 0
        )
      )
      .filter(
        (
          option
        ): option is SettlementAllocationOption =>
          option !== undefined
      )
      .sort(
        this.compareOldestFirst
      );
  }

  /**
   * Returns outstanding allocations owed by one
   * member to another member.
   */
  static getOutstandingBetweenMembers(
    householdId: string,
    fromMemberId: string,
    toMemberId: string
  ): SettlementAllocationOption[] {
    const normalizedFromMemberId =
      fromMemberId.trim();

    const normalizedToMemberId =
      toMemberId.trim();

    if (
      !normalizedFromMemberId ||
      !normalizedToMemberId ||
      normalizedFromMemberId ===
        normalizedToMemberId
    ) {
      return [];
    }

    return this.getOutstandingAllocations(
      householdId
    ).filter(
      (option) =>
        option.fromMemberId ===
          normalizedFromMemberId &&
        option.toMemberId ===
          normalizedToMemberId
    );
  }

  /**
   * Returns one allocation option when it is still
   * eligible for settlement.
   */
  static getOutstandingAllocationById(
    householdId: string,
    expenseAllocationId: string
  ): SettlementAllocationOption | undefined {
    const allocation =
      ExpenseAllocationRepository.findById(
        expenseAllocationId.trim()
      );

    if (!allocation) {
      return undefined;
    }

    return this.buildOption(
      allocation,
      householdId
    );
  }

  /**
   * Returns the total outstanding balance between
   * a debtor and creditor.
   */
  static getOutstandingTotalBetweenMembers(
    householdId: string,
    fromMemberId: string,
    toMemberId: string
  ): number {
    const total =
      this.getOutstandingBetweenMembers(
        householdId,
        fromMemberId,
        toMemberId
      ).reduce(
        (currentTotal, option) =>
          currentTotal +
          option.outstandingAmount,
        0
      );

    return this.roundCurrency(
      total
    );
  }

  /**
   * Converts one eligible expense allocation into
   * a standard outstanding settlement option.
   */
  private static buildOption(
    allocation: ExpenseAllocation,
    householdId: string
  ): SettlementAllocationOption | undefined {
    if (
      !this.isEligibleAllocation(
        allocation
      )
    ) {
      return undefined;
    }

    const transaction =
      TransactionRepository.findById(
        allocation.transactionId
      );

    if (
      !this.isEligibleTransaction(
        transaction,
        householdId
      )
    ) {
      return undefined;
    }

    const paymentDetails =
      AllocationPaymentService.getPaymentDetails(
        allocation
      );

    if (
      paymentDetails.outstandingAmount <= 0
    ) {
      return undefined;
    }

    return {
      expenseAllocationId:
        allocation.id,

      transactionId:
        allocation.transactionId,

      fromMemberId:
        allocation.memberId,

      toMemberId:
        allocation.paidByMemberId,

      transactionDate:
        new Date(
          transaction.transactionDate
        ),

      category:
        transaction.category,

      description:
        transaction.description,

      allocatedAmount:
        paymentDetails.allocatedAmount,

      paidAmount:
        paymentDetails.paidAmount,

      outstandingAmount:
        paymentDetails.outstandingAmount,

      paymentStatus:
        paymentDetails.paymentStatus,
    };
  }

  /**
   * Builds an option for settlement editing.
   *
   * The current settlement's applied amount is removed
   * from paid totals and restored to outstanding totals.
   */
  private static buildEditOption(
    allocation: ExpenseAllocation,
    householdId: string,
    currentSettlementAppliedAmount: number
  ): SettlementAllocationOption | undefined {
    if (
      !this.isEligibleAllocation(
        allocation
      )
    ) {
      return undefined;
    }

    const transaction =
      TransactionRepository.findById(
        allocation.transactionId
      );

    if (
      !this.isEligibleTransaction(
        transaction,
        householdId
      )
    ) {
      return undefined;
    }

    const paymentDetails =
      AllocationPaymentService.getPaymentDetails(
        allocation
      );

    const adjustedPaidAmount =
      this.roundCurrency(
        Math.max(
          paymentDetails.paidAmount -
            currentSettlementAppliedAmount,
          0
        )
      );

    const adjustedOutstandingAmount =
      this.roundCurrency(
        Math.max(
          paymentDetails.allocatedAmount -
            adjustedPaidAmount,
          0
        )
      );

    if (
      adjustedOutstandingAmount <= 0
    ) {
      return undefined;
    }

    return {
      expenseAllocationId:
        allocation.id,

      transactionId:
        allocation.transactionId,

      fromMemberId:
        allocation.memberId,

      toMemberId:
        allocation.paidByMemberId,

      transactionDate:
        new Date(
          transaction.transactionDate
        ),

      category:
        transaction.category,

      description:
        transaction.description,

      allocatedAmount:
        paymentDetails.allocatedAmount,

      paidAmount:
        adjustedPaidAmount,

      outstandingAmount:
        adjustedOutstandingAmount,

      paymentStatus:
        this.derivePaymentStatus(
          paymentDetails.allocatedAmount,
          adjustedPaidAmount,
          adjustedOutstandingAmount
        ),
    };
  }

  /**
   * Checks allocation-level settlement eligibility.
   */
  private static isEligibleAllocation(
    allocation: ExpenseAllocation
  ): boolean {
    return (
      allocation.isIncluded &&
      allocation.allocatedAmount > 0 &&
      allocation.memberId !==
        allocation.paidByMemberId
    );
  }

  /**
   * Checks transaction-level settlement eligibility.
   */
  private static isEligibleTransaction(
    transaction:
      | ReturnType<
          typeof TransactionRepository.findById
        >
      | undefined,
    householdId: string
  ): transaction is NonNullable<
    ReturnType<
      typeof TransactionRepository.findById
    >
  > {
    return Boolean(
      transaction &&
      transaction.householdId ===
        householdId.trim() &&
      transaction.type === "expense" &&
      transaction.isActive
    );
  }

  /**
   * Derives allocation status after excluding
   * the settlement currently being edited.
   */
  private static derivePaymentStatus(
    allocatedAmount: number,
    paidAmount: number,
    outstandingAmount: number
  ): SettlementAllocationOption["paymentStatus"] {
    if (
      allocatedAmount <= 0 ||
      outstandingAmount <= 0
    ) {
      return "paid";
    }

    if (paidAmount <= 0) {
      return "unpaid";
    }

    return "partially-paid";
  }

  /**
   * Orders allocation options from oldest
   * transaction to newest.
   */
  private static compareOldestFirst(
    first: SettlementAllocationOption,
    second: SettlementAllocationOption
  ): number {
    const dateDifference =
      first.transactionDate.getTime() -
      second.transactionDate.getTime();

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return first.expenseAllocationId.localeCompare(
      second.expenseAllocationId
    );
  }

  /**
   * Normalizes monetary values to cents.
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