import type { Transaction } from "../models/Transaction";

export default class TransactionRepository {
  /**
   * Demo data source.
   *
   * Replace with database or API persistence
   * in a future sprint.
   */
  private static transactions: Transaction[] = [
    {
      id: "txn-001",
      householdId: "household-001",

      createdByMemberId: "member-001",
      visibility: "household",

      type: "income",
      amount: 75000,

      sourceAccountId: null,
      destinationAccountId: "acc-001",

      category: "Salary",
      description: "Monthly salary",
      notes: "",

      transactionDate: new Date(
        "2026-07-01T00:00:00"
      ),

      isActive: true,

      createdAt: new Date(
        "2026-07-01T08:00:00"
      ),

      updatedAt: new Date(
        "2026-07-01T08:00:00"
      ),
    },
    {
      id: "txn-002",
      householdId: "household-001",

      createdByMemberId: "member-001",
      visibility: "household",

      type: "expense",
      amount: 8500,

      sourceAccountId: "acc-001",
      destinationAccountId: null,

      category: "Housing",
      description: "Monthly rent",
      notes: "",

      transactionDate: new Date(
        "2026-07-02T00:00:00"
      ),

      isActive: true,

      createdAt: new Date(
        "2026-07-02T09:00:00"
      ),

      updatedAt: new Date(
        "2026-07-02T09:00:00"
      ),
    },
    {
      id: "txn-003",
      householdId: "household-001",

      createdByMemberId: "member-001",
      visibility: "household",

      type: "expense",
      amount: 3200,

      sourceAccountId: "acc-001",
      destinationAccountId: null,

      category: "Groceries",
      description: "Weekly groceries",
      notes: "",

      transactionDate: new Date(
        "2026-07-05T00:00:00"
      ),

      isActive: true,

      createdAt: new Date(
        "2026-07-05T14:30:00"
      ),

      updatedAt: new Date(
        "2026-07-05T14:30:00"
      ),
    },
    {
      id: "txn-004",
      householdId: "household-001",

      createdByMemberId: "member-001",
      visibility: "household",

      type: "transfer",
      amount: 5000,

      sourceAccountId: "acc-001",
      destinationAccountId: "acc-002",

      category: "Account Transfer",
      description: "Transfer to GCash",
      notes: "",

      transactionDate: new Date(
        "2026-07-07T00:00:00"
      ),

      isActive: true,

      createdAt: new Date(
        "2026-07-07T10:15:00"
      ),

      updatedAt: new Date(
        "2026-07-07T10:15:00"
      ),
    },
  ];

  /**
   * Returns all transactions.
   */
  static findAll(): Transaction[] {
    return this.transactions.map(
      (transaction) =>
        this.clone(transaction)
    );
  }

  /**
   * Finds a transaction by ID.
   */
  static findById(
    id: string
  ): Transaction | undefined {
    const transaction =
      this.transactions.find(
        (item) => item.id === id
      );

    return transaction
      ? this.clone(transaction)
      : undefined;
  }

  /**
   * Creates a transaction.
   */
  static create(
    transaction: Transaction
  ): Transaction {
    const storedTransaction =
      this.clone(transaction);

    this.transactions.push(
      storedTransaction
    );

    return this.clone(
      storedTransaction
    );
  }

  /**
   * Updates an existing transaction.
   */
  static update(
    id: string,
    transaction: Transaction
  ): Transaction | undefined {
    const transactionIndex =
      this.transactions.findIndex(
        (item) => item.id === id
      );

    if (transactionIndex === -1) {
      return undefined;
    }

    const updatedTransaction =
      this.clone(transaction);

    this.transactions[
      transactionIndex
    ] = updatedTransaction;

    return this.clone(
      updatedTransaction
    );
  }

  /**
   * Deletes a transaction.
   */
  static delete(id: string): boolean {
    const transactionIndex =
      this.transactions.findIndex(
        (item) => item.id === id
      );

    if (transactionIndex === -1) {
      return false;
    }

    this.transactions.splice(
      transactionIndex,
      1
    );

    return true;
  }

  /**
   * Returns a defensive transaction copy.
   */
  private static clone(
    transaction: Transaction
  ): Transaction {
    return {
      ...transaction,

      transactionDate:
        new Date(
          transaction.transactionDate
        ),

      createdAt:
        new Date(
          transaction.createdAt
        ),

      updatedAt:
        new Date(
          transaction.updatedAt
        ),
    };
  }
}