import type {
  MemberSettlementBalance,
  MemberSettlementPosition,
} from "../models/MemberSettlementBalance";

import type {
  MemberSettlementObligation,
} from "../models/MemberSettlementObligation";

import type {
  ExpenseAllocation,
} from "../../transactions/models/ExpenseAllocation";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import TransactionRepository from "../../transactions/repositories/TransactionRepository";

import ExpenseAllocationRepository from "../../transactions/repositories/ExpenseAllocationRepository";

import AllocationPaymentService from "./AllocationPaymentService";

export default class SettlementBalanceService {
  /**
   * Returns settlement balances for all active members
   * belonging to a household.
   */
  static getMemberBalances(
    householdId: string
  ): MemberSettlementBalance[] {
    const members =
      HouseholdMemberService.getActiveMembers()
        .filter(
          (member) =>
            member.householdId === householdId
        );

    const obligations =
      this.getWhoOwesWhom(
        householdId
      );

    return members.map((member) => {
      const amountToReceive =
        obligations
          .filter(
            (obligation) =>
              obligation.toMemberId ===
              member.id
          )
          .reduce(
            (total, obligation) =>
              total + obligation.amount,
            0
          );

      const amountToPay =
        obligations
          .filter(
            (obligation) =>
              obligation.fromMemberId ===
              member.id
          )
          .reduce(
            (total, obligation) =>
              total + obligation.amount,
            0
          );

      const roundedAmountToReceive =
        this.roundCurrency(
          amountToReceive
        );

      const roundedAmountToPay =
        this.roundCurrency(
          amountToPay
        );

      const netPosition =
        this.roundCurrency(
          roundedAmountToReceive -
            roundedAmountToPay
        );

      return {
        memberId: member.id,

        amountToReceive:
          roundedAmountToReceive,

        amountToPay:
          roundedAmountToPay,

        netPosition,

        position:
          this.derivePosition(
            netPosition
          ),
      };
    });
  }

  /**
   * Returns one member's derived settlement balance.
   */
  static getMemberBalance(
    householdId: string,
    memberId: string
  ): MemberSettlementBalance | undefined {
    return this.getMemberBalances(
      householdId
    ).find(
      (balance) =>
        balance.memberId === memberId
    );
  }

  /**
   * Returns aggregated who-owes-whom obligations
   * for a household.
   *
   * Each debtor and creditor pair appears once.
   */
  static getWhoOwesWhom(
    householdId: string
  ): MemberSettlementObligation[] {
    const allocations =
      this.getEligibleAllocations(
        householdId
      );

    const obligations =
      new Map<
        string,
        MemberSettlementObligation
      >();

    for (const allocation of allocations) {
      const paymentDetails =
        AllocationPaymentService.getPaymentDetails(
          allocation
        );

      if (
        paymentDetails.isSelfAllocation ||
        paymentDetails.outstandingAmount <= 0
      ) {
        continue;
      }

      const fromMemberId =
        allocation.memberId;

      const toMemberId =
        allocation.paidByMemberId;

      const obligationKey =
        this.createObligationKey(
          fromMemberId,
          toMemberId
        );

      const existing =
        obligations.get(
          obligationKey
        );

      if (existing) {
        obligations.set(
          obligationKey,
          {
            ...existing,

            amount:
              this.roundCurrency(
                existing.amount +
                  paymentDetails.outstandingAmount
              ),

            allocationCount:
              existing.allocationCount + 1,
          }
        );

        continue;
      }

      obligations.set(
        obligationKey,
        {
          fromMemberId,
          toMemberId,

          amount:
            paymentDetails.outstandingAmount,

          allocationCount: 1,
        }
      );
    }

    return Array.from(
      obligations.values()
    ).sort(
      (first, second) => {
        if (
          first.fromMemberId !==
          second.fromMemberId
        ) {
          return first.fromMemberId.localeCompare(
            second.fromMemberId
          );
        }

        return first.toMemberId.localeCompare(
          second.toMemberId
        );
      }
    );
  }

  /**
   * Returns the outstanding amount one member owes
   * another member.
   */
  static getOutstandingBetweenMembers(
    householdId: string,
    fromMemberId: string,
    toMemberId: string
  ): number {
    const obligation =
      this.getWhoOwesWhom(
        householdId
      ).find(
        (item) =>
          item.fromMemberId ===
            fromMemberId &&
          item.toMemberId ===
            toMemberId
      );

    return obligation?.amount ?? 0;
  }

  /**
   * Returns active, included allocations belonging
   * to active expense transactions in the household.
   */
  private static getEligibleAllocations(
    householdId: string
  ): ExpenseAllocation[] {
    const activeExpenseTransactionIds =
      new Set(
        TransactionRepository.findAll()
          .filter(
            (transaction) =>
              transaction.householdId ===
                householdId &&
              transaction.type ===
                "expense" &&
              transaction.isActive
          )
          .map(
            (transaction) =>
              transaction.id
          )
      );

    return ExpenseAllocationRepository.findAll()
      .filter(
        (allocation) =>
          activeExpenseTransactionIds.has(
            allocation.transactionId
          ) &&
          allocation.isIncluded &&
          allocation.allocatedAmount > 0
      );
  }

  /**
   * Derives whether the member is a creditor,
   * debtor, or fully settled.
   */
  private static derivePosition(
    netPosition: number
  ): MemberSettlementPosition {
    if (netPosition > 0) {
      return "creditor";
    }

    if (netPosition < 0) {
      return "debtor";
    }

    return "settled";
  }

  /**
   * Creates a stable map key for one directed
   * debtor-to-creditor relationship.
   */
  private static createObligationKey(
    fromMemberId: string,
    toMemberId: string
  ): string {
    return `${fromMemberId}::${toMemberId}`;
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