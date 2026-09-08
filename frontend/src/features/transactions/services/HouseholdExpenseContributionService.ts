import HouseholdMemberService from "../../household/services/HouseholdMemberService";
import { findHouseholdMemberByReference } from "../../household/services/householdMemberResolution";
import { roundCurrencyAmount } from "../../../shared/utils/currencyConversion";
import MonthlyExpenseReportingService from "./MonthlyExpenseReportingService";

export interface MemberHouseholdExpenseContribution {
  memberId: string;
  memberName: string;
  amount: number;
  percentage: number;
  expenseCount: number;
}

export interface HouseholdExpenseContributionSummary {
  totalAmount: number;
  memberContributions: MemberHouseholdExpenseContribution[];
  unassignedAmount?: number;
}

export default class HouseholdExpenseContributionService {
  static getMonthlySummary(householdId: string, selectedMonth: Date): HouseholdExpenseContributionSummary {
    const members = HouseholdMemberService.getMembers().filter((member) => member.householdId === householdId);
    const expenses = MonthlyExpenseReportingService.getMonthlyExpenses(householdId, selectedMonth);
    const totals = new Map(members.map((member) => [member.id, { amount: 0, expenseIds: new Set<string>() }]));

    for (const expense of expenses) {
      for (const share of expense.shares) {
        if (share.amount <= 0) continue;
        const member = findHouseholdMemberByReference(share.memberId, householdId);
        const total = member ? totals.get(member.id) : undefined;
        if (!total) continue;
        total.amount = roundCurrencyAmount(total.amount + share.amount);
        total.expenseIds.add(expense.id);
      }
    }

    const totalAmount = roundCurrencyAmount(expenses.reduce((sum, expense) => sum + expense.amount, 0));
    const memberContributions = members.filter((member) => member.isActive || (totals.get(member.id)?.amount ?? 0) > 0)
      .map((member) => {
        const total = totals.get(member.id)!;
        return {
          memberId: member.id, memberName: member.displayName, amount: total.amount,
          percentage: totalAmount > 0 ? Math.round(total.amount / totalAmount * 100) : 0,
          expenseCount: total.expenseIds.size,
        };
      }).sort((a, b) => b.amount - a.amount);

    return {
      totalAmount, memberContributions,
      unassignedAmount: roundCurrencyAmount(totalAmount - memberContributions.reduce((sum, member) => sum + member.amount, 0)),
    };
  }
}
