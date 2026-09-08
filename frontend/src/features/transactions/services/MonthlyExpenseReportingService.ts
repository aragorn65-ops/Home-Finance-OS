import { isSameMonth } from "../../../shared/utils/monthSelection";
import type { Transaction } from "../models/Transaction";
import TransactionRepository from "../repositories/TransactionRepository";
import ExpenseAllocationRepository from "../repositories/ExpenseAllocationRepository";
import UtilityProviderBillRepository from "../../utilities/repositories/UtilityProviderBillRepository";

export interface MonthlyExpenseRecord extends Pick<Transaction,
  "id" | "amount" | "category" | "transactionDate" | "isActive" | "type"
> {
  shares: Array<{ memberId: string; amount: number }>;
}

export default class MonthlyExpenseReportingService {
  static getMonthlyExpenses(householdId: string, month: Date): MonthlyExpenseRecord[] {
    const transactions = TransactionRepository.findAll().filter((transaction) =>
      transaction.householdId === householdId && transaction.isActive && transaction.type === "expense"
    );
    const recordedIds = new Set(transactions.map((transaction) => transaction.id));
    const allocations = ExpenseAllocationRepository.findAll();
    const records: MonthlyExpenseRecord[] = transactions
      .filter((transaction) => isSameMonth(transaction.transactionDate, month))
      .map((transaction) => {
        const shares = allocations.filter((allocation) => allocation.transactionId === transaction.id && allocation.isIncluded);
        return {
          ...transaction,
          shares: shares.length > 0
            ? shares.map((allocation) => ({ memberId: allocation.memberId, amount: allocation.allocatedAmount }))
            : transaction.expenseSplitMethod === "none" && transaction.paidByMemberId
              ? [{ memberId: transaction.paidByMemberId, amount: transaction.amount }]
              : [],
        };
      });

    // A linked expense already represents the bill; payment status is never changed here.
    for (const bill of UtilityProviderBillRepository.findActiveByHouseholdId(householdId)) {
      if (bill.status !== "unpaid" || recordedIds.has(bill.transactionId) ||
        !isSameMonth(bill.billingDate, month)) continue;
      records.push({
        id: `provider-bill:${bill.id}`, amount: bill.totalBillAmount,
        category: bill.utilityType === "electricity" ? "Electricity" : bill.utilityType === "water" ? "Water" : "Internet",
        transactionDate: bill.billingDate, isActive: true, type: "expense",
        shares: bill.memberShareSnapshot.map((share) => ({ memberId: share.memberId, amount: share.finalShareAmount })),
      });
    }
    return records;
  }
}
