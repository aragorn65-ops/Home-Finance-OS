import { isSameMonth } from "../../../shared/utils/monthSelection";
import type { Transaction } from "../models/Transaction";
import TransactionRepository from "../repositories/TransactionRepository";
import UtilityProviderBillRepository from "../../utilities/repositories/UtilityProviderBillRepository";

export type MonthlyExpenseRecord = Pick<Transaction,
  "amount" | "category" | "transactionDate" | "isActive" | "type"
>;

export default class MonthlyExpenseReportingService {
  static getUnrecordedUnpaidBills(householdId: string, month: Date) {
    const recordedExpenseIds = new Set(
      TransactionRepository.findAll()
        .filter((transaction) => transaction.householdId === householdId &&
          transaction.isActive && transaction.type === "expense")
        .map((transaction) => transaction.id)
    );

    // A linked expense already represents the bill, even if its status is stale.
    return UtilityProviderBillRepository.findActiveByHouseholdId(householdId)
      .filter((bill) => bill.status === "unpaid" &&
        isSameMonth(bill.billingDate, month) &&
        !recordedExpenseIds.has(bill.transactionId));
  }

  static getMonthlyExpenses(householdId: string, month: Date): MonthlyExpenseRecord[] {
    const transactions = TransactionRepository.findAll().filter((transaction) =>
      transaction.householdId === householdId && transaction.isActive &&
      transaction.type === "expense" && isSameMonth(transaction.transactionDate, month)
    );
    const unpaidBills = this.getUnrecordedUnpaidBills(householdId, month);

    return [...transactions, ...unpaidBills.map((bill): MonthlyExpenseRecord => ({
      amount: bill.totalBillAmount,
      category: bill.utilityType === "electricity" ? "Electricity" :
        bill.utilityType === "water" ? "Water" : "Internet",
      transactionDate: bill.billingDate,
      isActive: true,
      type: "expense",
    }))];
  }
}
