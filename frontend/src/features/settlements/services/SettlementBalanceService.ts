import type {
  MemberSettlementBalance,
  MemberSettlementPosition,
} from "../models/MemberSettlementBalance";

import type {
  MemberSettlementObligation,
} from "../models/MemberSettlementObligation";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import SettlementAllocationService from "./SettlementAllocationService";
import SettlementOverpaymentCreditService from "./SettlementOverpaymentCreditService";

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
      SettlementOverpaymentCreditService
        .applyCreditOffsetsToAllocations(
          householdId,
          SettlementAllocationService
            .getOutstandingAllocations(
              householdId
            )
        );

    const obligations =
      new Map<
        string,
        MemberSettlementObligation
      >();

    for (const allocation of allocations) {
      if (
        allocation.fromMemberId ===
          allocation.toMemberId ||
        allocation.outstandingAmount <= 0
      ) {
        continue;
      }

      const fromMemberId =
        allocation.fromMemberId;

      const toMemberId =
        allocation.toMemberId;

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
                  allocation.outstandingAmount
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
            allocation.outstandingAmount,

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
