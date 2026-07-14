import type { SettlementApplicationDetails } from "../models/SettlementApplicationDetails";

import SettlementApplicationRepository from "../repositories/SettlementApplicationRepository";

import ExpenseAllocationRepository from "../../transactions/repositories/ExpenseAllocationRepository";

import TransactionRepository from "../../transactions/repositories/TransactionRepository";

import AllocationPaymentService from "./AllocationPaymentService";

export default class SettlementApplicationDetailsService {
  /**
   * Returns itemized application details belonging
   * to one settlement.
   */
  static getBySettlementId(
    settlementId: string
  ): SettlementApplicationDetails[] {
    if (!settlementId.trim()) {
      return [];
    }

    return SettlementApplicationRepository
      .findBySettlementId(
        settlementId
      )
      .map((application) => {
        const allocation =
          ExpenseAllocationRepository.findById(
            application.expenseAllocationId
          );

        if (!allocation) {
          return undefined;
        }

        const transaction =
          TransactionRepository.findById(
            allocation.transactionId
          );

        if (
          !transaction ||
          transaction.type !== "expense"
        ) {
          return undefined;
        }

        const paymentDetails =
          AllocationPaymentService.getPaymentDetails(
            allocation
          );

        return {
          settlementApplicationId:
            application.id,

          expenseAllocationId:
            allocation.id,

          transactionId:
            allocation.transactionId,

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

          appliedAmount:
            this.roundCurrency(
              application.appliedAmount
            ),

          paidAmount:
            paymentDetails.paidAmount,

          outstandingAmount:
            paymentDetails.outstandingAmount,

          paymentStatus:
            paymentDetails.paymentStatus,
        };
      })
      .filter(
        (
          details
        ): details is SettlementApplicationDetails =>
          details !== undefined
      )
      .sort(
        (first, second) => {
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
      );
  }

  /**
   * Returns one settlement application detail record.
   */
  static getByApplicationId(
    settlementApplicationId: string
  ): SettlementApplicationDetails | undefined {
    if (!settlementApplicationId.trim()) {
      return undefined;
    }

    const application =
      SettlementApplicationRepository.findById(
        settlementApplicationId
      );

    if (!application) {
      return undefined;
    }

    return this.getBySettlementId(
      application.settlementId
    ).find(
      (details) =>
        details.settlementApplicationId ===
        settlementApplicationId
    );
  }

  /**
   * Returns the total amount represented by
   * applications belonging to a settlement.
   */
  static getAppliedTotal(
    settlementId: string
  ): number {
    const total =
      this.getBySettlementId(
        settlementId
      ).reduce(
        (
          currentTotal,
          details
        ) =>
          currentTotal +
          details.appliedAmount,
        0
      );

    return this.roundCurrency(
      total
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