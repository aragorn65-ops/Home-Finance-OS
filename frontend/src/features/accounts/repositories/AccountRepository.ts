import type { Account } from "../models/Account";

export default class AccountRepository {
  /**
   * Demo data source.
   *
   * Replace with database or API persistence
   * in a future sprint.
   */
  private static accounts: Account[] = [
    {
      id: "acc-001",
      householdId: "household-001",

      ownerMemberId: "member-001",
      visibility: "household",

      name: "BPI Savings",
      institution: "Bank of the Philippine Islands",

      accountClass: "asset",
      type: "savings",

      currency: "PHP",

      openingBalance: 50000,
      currentBalance: 125000,

      accountNumber: "****1234",

      isActive: true,

      createdAt: new Date("2026-07-01T08:00:00"),
      updatedAt: new Date("2026-07-01T08:00:00"),
    },
    {
      id: "acc-002",
      householdId: "household-001",

      ownerMemberId: "member-001",
      visibility: "household",

      name: "GCash",
      institution: "GCash",

      accountClass: "asset",
      type: "e-wallet",

      currency: "PHP",

      openingBalance: 5000,
      currentBalance: 12750,

      accountNumber: undefined,

      isActive: true,

      createdAt: new Date("2026-07-01T08:00:00"),
      updatedAt: new Date("2026-07-01T08:00:00"),
    },
    {
      id: "acc-003",
      householdId: "household-001",

      ownerMemberId: "member-001",
      visibility: "private",

      name: "Personal Cash",
      institution: undefined,

      accountClass: "asset",
      type: "cash",

      currency: "PHP",

      openingBalance: 3000,
      currentBalance: 3000,

      accountNumber: undefined,

      isActive: true,

      createdAt: new Date("2026-07-01T08:00:00"),
      updatedAt: new Date("2026-07-01T08:00:00"),
    },
  ];

  /**
   * Returns all accounts.
   */
  static findAll(): Account[] {
    return this.accounts.map((account) =>
      this.clone(account)
    );
  }

  /**
   * Finds an account by ID.
   */
  static findById(
    id: string
  ): Account | undefined {
    const account = this.accounts.find(
      (item) => item.id === id
    );

    return account
      ? this.clone(account)
      : undefined;
  }

  /**
   * Creates a new account.
   */
  static create(account: Account): Account {
    const storedAccount = this.clone(account);

    this.accounts.push(storedAccount);

    return this.clone(storedAccount);
  }

  /**
   * Updates an existing account.
   */
  static update(
    account: Account
  ): Account | undefined {
    const accountIndex = this.accounts.findIndex(
      (item) => item.id === account.id
    );

    if (accountIndex === -1) {
      return undefined;
    }

    const updatedAccount = this.clone(account);

    this.accounts[accountIndex] = updatedAccount;

    return this.clone(updatedAccount);
  }

  /**
   * Removes an account from the demo repository.
   */
  static delete(id: string): boolean {
    const accountIndex = this.accounts.findIndex(
      (item) => item.id === id
    );

    if (accountIndex === -1) {
      return false;
    }

    this.accounts.splice(accountIndex, 1);

    return true;
  }

  /**
   * Returns a defensive account copy.
   */
  private static clone(
    account: Account
  ): Account {
    return {
      ...account,

      paymentDueDate: account.paymentDueDate
        ? new Date(account.paymentDueDate)
        : undefined,

      createdAt: new Date(account.createdAt),
      updatedAt: new Date(account.updatedAt),
    };
  }
}