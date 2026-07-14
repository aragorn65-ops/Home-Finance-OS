import type {
  AllocationPaymentStatus,
  ExpenseAllocation,
} from "../../transactions/models/ExpenseAllocation";

import type { AllocationPaymentDetails } from "../models/AllocationPaymentDetails";

import SettlementRepository from "../repositories/SettlementRepository";
import SettlementApplicationRepository from "../repositories/SettlementApplicationRepository";

export default class AllocationPaymentService {
  /**
   * Returns derived payment details for one allocation.
   */
  static getPaymentDetails(
    allocation: ExpenseAllocation
  ): AllocationPaymentDetails {
    const isSelfAllocation =
      allocation.memberId ===
      allocation.paidByMemberId;

    const allocatedAmount =
      this.roundCurrency(
        allocation.allocatedAmount
      );

    const paidAmount =
      this.calculatePaidAmount(
        allocation.id
      );

    /**
     * The payer's own share does not create
     * a reimbursement obligation.
     *
     * Its paid amount remains based only on settlement
     * applications, but its outstanding amount is zero.
     */
    const outstandingAmount =
      isSelfAllocation
        ? 0
        : this.calculateOutstandingAmount(
            allocatedAmount,
            paidAmount
          );

    const paymentStatus =
      this.derivePaymentStatus(
        allocatedAmount,
        paidAmount,
        outstandingAmount,
        isSelfAllocation
      );

    return {
      expenseAllocationId:
        allocation.id,

      paidByMemberId:
        allocation.paidByMemberId,

      memberId:
        allocation.memberId,

      allocatedAmount,
      paidAmount,
      outstandingAmount,
      paymentStatus,
      isSelfAllocation,
    };
  }

  /**
   * Returns payment details for multiple allocations.
   */
  static getPaymentDetailsMany(
    allocations: ExpenseAllocation[]
  ): AllocationPaymentDetails[] {
    return allocations.map(
      (allocation) =>
        this.getPaymentDetails(
          allocation
        )
    );
  }

  /**
   * Returns the total amount paid toward an allocation
   * through applications belonging to active settlements.
   */
  static calculatePaidAmount(
    expenseAllocationId: string
  ): number {
    const applications =
      SettlementApplicationRepository.findByExpenseAllocationId(
        expenseAllocationId
      );

    const activeAppliedAmount =
      applications.reduce(
        (total, application) => {
          const settlement =
            SettlementRepository.findById(
              application.settlementId
            );

          if (
            !settlement ||
            !settlement.isActive
          ) {
            return total;
          }

          return (
            total +
            application.appliedAmount
          );
        },
        0
      );

    return this.roundCurrency(
      activeAppliedAmount
    );
  }

  /**
   * Returns the remaining reimbursable amount
   * for one allocation.
   */
  static getOutstandingAmount(
    allocation: ExpenseAllocation
  ): number {
    return this.getPaymentDetails(
      allocation
    ).outstandingAmount;
  }

  /**
   * Returns the derived payment status
   * for one allocation.
   */
  static getPaymentStatus(
    allocation: ExpenseAllocation
  ): AllocationPaymentStatus {
    return this.getPaymentDetails(
      allocation
    ).paymentStatus;
  }

  /**
   * Calculates remaining outstanding value.
   *
   * Defensive clamping prevents floating-point
   * rounding from returning a negative balance.
   */
  private static calculateOutstandingAmount(
    allocatedAmount: number,
    paidAmount: number
  ): number {
    const outstandingAmount =
      allocatedAmount - paidAmount;

    return this.roundCurrency(
      Math.max(
        outstandingAmount,
        0
      )
    );
  }

  /**
   * Derives status without storing it
   * on the expense allocation.
   */
  private static derivePaymentStatus(
    allocatedAmount: number,
    paidAmount: number,
    outstandingAmount: number,
    isSelfAllocation: boolean
  ): AllocationPaymentStatus {
    if (
      isSelfAllocation ||
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