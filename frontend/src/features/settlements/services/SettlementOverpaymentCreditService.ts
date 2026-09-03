import SettlementRepository from "../repositories/SettlementRepository";
import SettlementApplicationRepository from "../repositories/SettlementApplicationRepository";

import type { SettlementOverpaymentCredit } from "../models/SettlementOverpaymentCredit";

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

  private static roundCurrency(
    amount: number
  ): number {
    return (
      Math.round(amount * 100) /
      100
    );
  }
}

