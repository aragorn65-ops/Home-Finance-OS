import type { Account } from "../models/Account";

export default class AccountRepository {
  /**
   * In-memory demo data.
   * Replace with a database implementation in a future sprint.
   */
  private static accounts: Account[] = [
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

  /**
   * Returns all accounts.
   */
  static findAll(): Account[] {
    return [...this.accounts];
  }

  /**
   * Finds an account by ID.
   */
  static findById(id: string): Account | undefined {
    return this.accounts.find((account) => account.id === id);
  }

  /**
   * Creates a new account.
   */
  static create(account: Account): Account {
    this.accounts.push(account);
    return account;
  }

  /**
   * Updates an existing account.
   */
  static update(account: Account): Account {
    const index = this.accounts.findIndex(
      (a) => a.id === account.id
    );

    if (index >= 0) {
      this.accounts[index] = account;
    }

    return account;
  }

  /**
   * Soft deletes an account.
   */
  static delete(id: string): boolean {
    const account = this.findById(id);

    if (!account) {
      return false;
    }

    account.isActive = false;
    account.updatedAt = new Date();

    return true;
  }
}