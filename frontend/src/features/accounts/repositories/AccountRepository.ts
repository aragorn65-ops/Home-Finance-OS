import type { Account } from "../models/Account";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import {
  loadHousehold,
} from "../../household/services/householdStorage";

export default class AccountRepository {
  /**
   * Demo in-memory data source.
   *
   * Demo accounts are initialized only after the single
   * active household has been created.
   */
  private static accounts: Account[] = [];

  private static initializedHouseholdId:
    string | null = null;

  /**
   * Returns all accounts.
   */
  static findAll(): Account[] {
    this.ensureInitialized();

    return this.accounts.map(
      (account) =>
        this.clone(account)
    );
  }

  /**
   * Finds an account by ID.
   */
  static findById(
    id: string
  ): Account | undefined {
    this.ensureInitialized();

    const account =
      this.accounts.find(
        (item) =>
          item.id === id
      );

    return account
      ? this.clone(account)
      : undefined;
  }

  /**
   * Creates a new account.
   */
  static create(
    account: Account
  ): Account {
    this.ensureInitialized();

    const storedAccount =
      this.clone(account);

    this.accounts.push(
      storedAccount
    );

    return this.clone(
      storedAccount
    );
  }

  /**
   * Updates an existing account.
   */
  static update(
    account: Account
  ): Account | undefined {
    this.ensureInitialized();

    const accountIndex =
      this.accounts.findIndex(
        (item) =>
          item.id === account.id
      );

    if (
      accountIndex === -1
    ) {
      return undefined;
    }

    const updatedAccount =
      this.clone(account);

    this.accounts[
      accountIndex
    ] = updatedAccount;

    return this.clone(
      updatedAccount
    );
  }

  /**
   * Removes an account from the demo repository.
   */
  static delete(
    id: string
  ): boolean {
    this.ensureInitialized();

    const accountIndex =
      this.accounts.findIndex(
        (item) =>
          item.id === id
      );

    if (
      accountIndex === -1
    ) {
      return false;
    }

    this.accounts.splice(
      accountIndex,
      1
    );

    return true;
  }

  /**
   * Initializes demo accounts for the single active
   * household.
   */
  private static ensureInitialized(): void {
    const household =
      loadHousehold();

    if (!household) {
      this.accounts = [];

      this.initializedHouseholdId =
        null;

      return;
    }

    if (
      this.initializedHouseholdId ===
      household.id
    ) {
      return;
    }

    const owner =
      HouseholdMemberService
        .getOwnerMember();

    const ownerMemberId =
      owner?.id ??
      "member-001";

    this.accounts =
      this.createDemoAccounts(
        household.id,
        ownerMemberId
      );

    this.initializedHouseholdId =
      household.id;
  }

  /**
   * Creates the default account collection for the
   * active household.
   */
  private static createDemoAccounts(
    householdId: string,
    ownerMemberId: string
  ): Account[] {
    const createdAt =
      new Date(
        "2026-07-01T08:00:00"
      );

    return [
      {
        id: "acc-001",
        householdId,

        ownerMemberId,
        visibility: "household",

        name: "BPI Savings",
        institution:
          "Bank of the Philippine Islands",

        accountClass: "asset",
        type: "savings",

        currency: "PHP",

        openingBalance: 50000,
        currentBalance: 125000,

        accountNumber:
          "****1234",

        isActive: true,

        createdAt,
        updatedAt:
          new Date(createdAt),
      },
      {
        id: "acc-002",
        householdId,

        ownerMemberId,
        visibility: "household",

        name: "GCash",
        institution: "GCash",

        accountClass: "asset",
        type: "e-wallet",

        currency: "PHP",

        openingBalance: 5000,
        currentBalance: 12750,

        accountNumber:
          undefined,

        isActive: true,

        createdAt:
          new Date(createdAt),

        updatedAt:
          new Date(createdAt),
      },
      {
        id: "acc-003",
        householdId,

        ownerMemberId,
        visibility: "private",

        name: "Personal Cash",
        institution:
          undefined,

        accountClass: "asset",
        type: "cash",

        currency: "PHP",

        openingBalance: 3000,
        currentBalance: 3000,

        accountNumber:
          undefined,

        isActive: true,

        createdAt:
          new Date(createdAt),

        updatedAt:
          new Date(createdAt),
      },
    ];
  }

  /**
   * Returns a defensive account copy.
   */
  private static clone(
    account: Account
  ): Account {
    return {
      ...account,

      paymentDueDate:
        account.paymentDueDate
          ? new Date(
              account.paymentDueDate
            )
          : undefined,

      createdAt:
        new Date(
          account.createdAt
        ),

      updatedAt:
        new Date(
          account.updatedAt
        ),
    };
  }
}