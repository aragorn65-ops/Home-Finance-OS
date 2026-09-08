import SettlementRepository from "../repositories/SettlementRepository";
import SettlementApplicationRepository from "../repositories/SettlementApplicationRepository";

import type { SettlementOverpaymentCredit } from "../models/SettlementOverpaymentCredit";

export interface CreditOffsetEligibleAllocation {
  fromMemberId: string;
  toMemberId: string;
  transactionDate: Date;
  outstandingAmount: number;
}

export default class SettlementOverpaymentCreditService {
  static getOpenCredits(
    householdId: string
  ): SettlementOverpaymentCredit[] {
    return SettlementRepository
      .findActiveByHouseholdId(
        householdId
      )
      .map((settlement) => {
        const appliedAmount =
          SettlementApplicationRepository
            .getAppliedAmountBySettlementId(
              settlement.id
            );
        const overpaymentAmount =
          this.roundCurrency(
            settlement.amount -
              appliedAmount
          );

        if (overpaymentAmount <= 0) {
          return undefined;
        }

        return {
          settlementId:
            settlement.id,
          householdId:
            settlement.householdId,
          creditMemberId:
            settlement.fromMemberId,
          counterpartyMemberId:
            settlement.toMemberId,
          amount:
            overpaymentAmount,
          settlementDate:
            settlement.settlementDate,
        };
      })
      .filter(
        (
          credit
        ): credit is SettlementOverpaymentCredit =>
          credit !== undefined
      )
      .sort(
        (first, second) =>
          second.settlementDate.getTime() -
          first.settlementDate.getTime()
      );
  }

  static getTotalOpenCredit(
    householdId: string
  ): number {
    return this.roundCurrency(
      this.getOpenCredits(householdId)
        .reduce(
          (total, credit) =>
            total + credit.amount,
          0
        )
    );
  }

  static applyCreditOffsetsToAllocations<
    Allocation extends CreditOffsetEligibleAllocation,
  >(
    householdId: string,
    allocations: Allocation[]
  ): Allocation[] {
    return this.deriveCreditOffsets(
      householdId,
      allocations
    ).adjustedAllocations;
  }

  static getRemainingOpenCredits<
    Allocation extends CreditOffsetEligibleAllocation,
  >(
    householdId: string,
    allocations: Allocation[]
  ): SettlementOverpaymentCredit[] {
    return this.deriveCreditOffsets(
      householdId,
      allocations
    ).remainingCredits;
  }

  private static deriveCreditOffsets<
    Allocation extends CreditOffsetEligibleAllocation,
  >(
    householdId: string,
    allocations: Allocation[]
  ): {
    adjustedAllocations: Allocation[];
    remainingCredits: SettlementOverpaymentCredit[];
  } {
    const creditBalances =
      this.getOpenCredits(
        householdId
      )
        .sort(
          (first, second) =>
            first.settlementDate.getTime() -
            second.settlementDate.getTime()
        )
        .map((credit) => ({
          credit,
          remainingAmount:
            this.roundCurrency(
              credit.amount
            ),
        }));

    if (
      creditBalances.length === 0 ||
      allocations.length === 0
    ) {
      return {
        adjustedAllocations:
          allocations.map(
            (allocation) => ({
              ...allocation,
            })
          ),
        remainingCredits:
          creditBalances.map(
            ({ credit }) => credit
          ),
      };
    }

    const adjustedAllocations =
      allocations.map(
        (allocation, index) => ({
          allocation: {
            ...allocation,
          },
          index,
        })
      );

    const chronologicalAllocations = [
      ...adjustedAllocations,
    ].sort((first, second) => {
      const dateDifference =
        first.allocation.transactionDate.getTime() -
        second.allocation.transactionDate.getTime();

      return dateDifference === 0
        ? first.index - second.index
        : dateDifference;
    });

    for (const entry of chronologicalAllocations) {
      let remainingOutstanding =
        this.roundCurrency(
          entry.allocation.outstandingAmount
        );

      if (remainingOutstanding <= 0) {
        entry.allocation.outstandingAmount = 0;
        continue;
      }

      for (const creditBalance of creditBalances) {
        if (
          creditBalance.remainingAmount <= 0 ||
          !this.canOffsetAllocation(
            creditBalance.credit,
            entry.allocation
          )
        ) {
          continue;
        }

        const offsetAmount =
          this.roundCurrency(
            Math.min(
              remainingOutstanding,
              creditBalance.remainingAmount
            )
          );

        remainingOutstanding =
          this.roundCurrency(
            remainingOutstanding -
              offsetAmount
          );

        creditBalance.remainingAmount =
          this.roundCurrency(
            creditBalance.remainingAmount -
              offsetAmount
          );

        if (remainingOutstanding <= 0) {
          break;
        }
      }

      entry.allocation.outstandingAmount =
        Math.max(
          this.roundCurrency(
            remainingOutstanding
          ),
          0
        );
    }

    const remainingCredits =
      creditBalances
        .filter(
          (creditBalance) =>
            creditBalance.remainingAmount > 0
        )
        .map(
          (creditBalance) => ({
            ...creditBalance.credit,
            amount:
              creditBalance.remainingAmount,
          })
        )
        .sort(
          (first, second) =>
            second.settlementDate.getTime() -
            first.settlementDate.getTime()
        );

    return {
      adjustedAllocations:
        adjustedAllocations
          .sort(
            (first, second) =>
              first.index - second.index
          )
          .map(
            (entry) =>
              entry.allocation
          ),
      remainingCredits,
    };
  }

  private static canOffsetAllocation(
    credit: SettlementOverpaymentCredit,
    allocation: CreditOffsetEligibleAllocation
  ): boolean {
    return (
      credit.creditMemberId ===
        allocation.fromMemberId &&
      credit.counterpartyMemberId ===
        allocation.toMemberId &&
      allocation.transactionDate.getTime() >
        credit.settlementDate.getTime()
    );
  }

  private static roundCurrency(
    amount: number
  ): number {
    return (
      Math.round(amount * 100) /
      100
    );
  }
}
