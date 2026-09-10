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

  // Reserve explicit manual amounts before allocating any remainder, regardless of date order.
  const reservedAmount = options.reduce((total, option) => {
    const current = currentByAllocationId.get(option.expenseAllocationId);
    return total + (current?.isSelected
      ? Math.min(Math.max(current.appliedAmount, 0), option.outstandingAmount)
      : 0);
  }, 0);
  let remainingAmount =
    Math.max(
      roundCurrency(settlementAmount - reservedAmount),
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
        current.appliedAmount > 0 ? Math.min(current.appliedAmount, option.outstandingAmount) : Math.min(
          option.outstandingAmount,
          remainingAmount
        )
      );

    if (current.appliedAmount <= 0) {
      remainingAmount = roundCurrency(remainingAmount - appliedAmount);
    }

    return {
      expenseAllocationId:
        option.expenseAllocationId,
      isSelected: true,
      appliedAmount,
    };
  });
}
