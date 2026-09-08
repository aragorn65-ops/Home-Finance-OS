import {
  isSameMonth,
} from "../../../shared/utils/monthSelection";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import ExpenseAllocationService from "./ExpenseAllocationService";
import TransactionService from "./TransactionService";

import type {
  ExpenseAllocation,
} from "../models/ExpenseAllocation";
import type {
  Transaction,
} from "../models/Transaction";

export interface MemberHouseholdExpenseContribution {
  memberId: string;
  memberName: string;
  amount: number;
  percentage: number;
  expenseCount: number;
}

export interface HouseholdExpenseContributionSummary {
  totalAmount: number;
  memberContributions:
    MemberHouseholdExpenseContribution[];
}

export default class HouseholdExpenseContributionService {
  static getMonthlySummary(
    householdId: string,
    selectedMonth: Date
  ): HouseholdExpenseContributionSummary {
    const activeMembers =
      HouseholdMemberService
        .getActiveMembers()
        .filter(
          (member) =>
            member.householdId ===
            householdId
        );

    const contributionsByMemberId =
      new Map<
        string,
        {
          amount: number;
          expenseIds: Set<string>;
        }
      >(
        activeMembers.map(
          (member) => [
            member.id,
            {
              amount: 0,
              expenseIds: new Set<string>(),
            },
          ]
        )
      );

    const householdExpenses =
      TransactionService
        .getTransactions()
        .filter(
          (transaction) =>
            this.isHouseholdExpenseForMonth(
              transaction,
              householdId,
              selectedMonth
            )
        );

    for (const expense of householdExpenses) {
      const allocations =
        ExpenseAllocationService
          .getByTransactionId(
            expense.id
          )
          .filter(
            (allocation) =>
              allocation.isIncluded &&
              allocation.allocatedAmount >
                0
          );

      if (allocations.length > 0) {
        this.addAllocatedExpense(
          contributionsByMemberId,
          expense.id,
          allocations
        );

        continue;
      }

      this.addLegacyExpense(
        contributionsByMemberId,
        expense
      );
    }

    const totalAmount =
      this.roundCurrency(
        Array.from(
          contributionsByMemberId.values()
        ).reduce(
          (total, contribution) =>
            total + contribution.amount,
          0
        )
      );

    const memberContributions =
      activeMembers
        .map((member) => {
          const contribution =
            contributionsByMemberId.get(
              member.id
            );

          const amount =
            this.roundCurrency(
              contribution?.amount ?? 0
            );

          return {
            memberId:
              member.id,
            memberName:
              member.displayName,
            amount,
            percentage:
              totalAmount > 0
                ? Math.round(
                    (amount /
                      totalAmount) *
                      100
                  )
                : 0,
            expenseCount:
              contribution?.expenseIds
                .size ?? 0,
          };
        })
        .sort(
          (first, second) =>
            second.amount - first.amount
        );

    return {
      totalAmount,
      memberContributions,
    };
  }

  private static isHouseholdExpenseForMonth(
    transaction: Transaction,
    householdId: string,
    selectedMonth: Date
  ): boolean {
    return (
      transaction.householdId ===
        householdId &&
      transaction.isActive &&
      transaction.type === "expense" &&
      transaction.visibility !==
        "private" &&
      isSameMonth(
        transaction.transactionDate,
        selectedMonth
      )
    );
  }

  private static addAllocatedExpense(
    contributionsByMemberId: Map<
      string,
      {
        amount: number;
        expenseIds: Set<string>;
      }
    >,
    expenseId: string,
    allocations: ExpenseAllocation[]
  ): void {
    for (const allocation of allocations) {
      const contribution =
        contributionsByMemberId.get(
          allocation.memberId
        );

      if (!contribution) {
        continue;
      }

      contribution.amount =
        this.roundCurrency(
          contribution.amount +
            allocation.allocatedAmount
        );

      contribution.expenseIds.add(
        expenseId
      );
    }
  }

  private static addLegacyExpense(
    contributionsByMemberId: Map<
      string,
      {
        amount: number;
        expenseIds: Set<string>;
      }
    >,
    expense: Transaction
  ): void {
    if (
      expense.expenseSplitMethod ===
      "none"
    ) {
      return;
    }

    const paidByMemberId =
      expense.paidByMemberId;

    if (!paidByMemberId) {
      return;
    }

    const contribution =
      contributionsByMemberId.get(
        paidByMemberId
      );

    if (!contribution) {
      return;
    }

    contribution.amount =
      this.roundCurrency(
        contribution.amount +
          expense.amount
      );

    contribution.expenseIds.add(
      expense.id
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
