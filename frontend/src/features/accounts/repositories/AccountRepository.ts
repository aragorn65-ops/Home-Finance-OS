import type { Account } from "../models/Account";

export default class AccountRepository {
  /**
   * Demo data source.
   * Replace with database access in a future sprint.
   */
  static findAll(): Account[] {
    return [
      {
        id: "acc-001",
        householdId: "household-001",
        name: "BPI Savings",
        institution: "Bank of the Philippine Islands",
        type: "savings",
        currency: "PHP",
        openingBalance: 50000,
        currentBalance: 125000,
        accountNumber: "****1234",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "acc-002",
        householdId: "household-001",
        name: "GCash",
        institution: "GCash",
        type: "e-wallet",
        currency: "PHP",
        openingBalance: 5000,
        currentBalance: 12750,
        accountNumber: "",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "acc-003",
        householdId: "household-001",
        name: "Cash Wallet",
        institution: "",
        type: "cash",
        currency: "PHP",
        openingBalance: 1000,
        currentBalance: 2800,
        accountNumber: "",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}