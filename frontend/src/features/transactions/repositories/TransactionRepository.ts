import type { Transaction } from "../models/Transaction";

export default class TransactionRepository {
  /**
   * Demo data source.
   * Replace with database access in a future sprint.
   */
  static findAll(): Transaction[] {
    return [
      {
        id: "txn-001",
        householdId: "household-001",
        accountId: "account-001",
        categoryId: "salary",
        payee: "ABC Company",
        description: "Monthly Salary",
        amount: 85000,
        type: "income",
        transactionDate: new Date("2026-07-01"),
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: "",
        tags: ["salary"],
      },
      {
        id: "txn-002",
        householdId: "household-001",
        accountId: "account-001",
        categoryId: "groceries",
        payee: "SM Supermarket",
        description: "Weekly Groceries",
        amount: 4200,
        type: "expense",
        transactionDate: new Date("2026-07-03"),
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: "",
        tags: ["food"],
      },
      {
        id: "txn-003",
        householdId: "household-001",
        accountId: "account-001",
        categoryId: "utilities",
        payee: "Meralco",
        description: "Electric Bill",
        amount: 3150,
        type: "expense",
        transactionDate: new Date("2026-07-05"),
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: "",
        tags: ["utilities"],
      },
    ];
  }
}