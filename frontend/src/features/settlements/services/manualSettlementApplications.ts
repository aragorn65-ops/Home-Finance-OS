import type { SettlementAllocationOption } from "../models/SettlementAllocationOption";
import type { SettlementApplicationForm } from "../models/SettlementApplicationForm";

function roundCurrency(
  amount: number
): number {
  return (
    Math.round(amount * 100) / 100
  );
}

export function recalculateManualSettlementApplications(
  options: SettlementAllocationOption[],
  currentApplications: SettlementApplicationForm[],
  settlementAmount: number
): SettlementApplicationForm[] {
  const currentByAllocationId =
    new Map(
      currentApplications.map(
        (application) => [
          application.expenseAllocationId,
          application,
        ]
      )
    );

  let remainingAmount =
    Math.max(
      roundCurrency(settlementAmount),
      0
    );

  return options.map((option) => {
    const current =
      currentByAllocationId.get(
        option.expenseAllocationId
      );

    if (!current?.isSelected) {
      return {
        expenseAllocationId:
          option.expenseAllocationId,
        isSelected: false,
        appliedAmount: 0,
      };
    }

    const appliedAmount =
      roundCurrency(
        Math.min(
          option.outstandingAmount,
          remainingAmount
        )
      );

    remainingAmount =
      roundCurrency(
        remainingAmount -
          appliedAmount
      );

    return {
      expenseAllocationId:
        option.expenseAllocationId,
      isSelected:
        appliedAmount > 0,
      appliedAmount,
    };
  });
}
