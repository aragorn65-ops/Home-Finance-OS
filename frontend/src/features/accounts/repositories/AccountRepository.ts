import type {
  Account,
  AccountClass,
  AccountType,
  AccountVisibility,
} from "../models/Account";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import {
  loadHousehold,
} from "../../household/services/householdStorage";

import {
  HFOS_STORAGE_KEYS,
  loadStoredData,
  saveStoredData,
} from "../../../shared/storage/localStorageStore";

interface SerializedAccount
  extends Omit<
    Account,
    | "paymentDueDate"
    | "exchangeRateEffectiveDate"
    | "createdAt"
    | "updatedAt"
  > {
  paymentDueDate?: string;
  exchangeRateEffectiveDate?: string;

  createdAt: string;
  updatedAt: string;
}

const accountClasses:
  AccountClass[] = [
    "asset",
    "liability",
  ];

const accountVisibilities:
  AccountVisibility[] = [
    "household",
    "private",
  ];

const accountTypes:
  AccountType[] = [
    "checking",
    "savings",
    "cash",
    "e-wallet",
    "investment",
    "credit-card",
    "line-of-credit",
    "loan",
    "mortgage",
    "other-asset",
    "other-liability",
  ];

export default class AccountRepository {
  /**
   * Hydrated account collection for the single
   * active household.
   */
  private static accounts:
    Account[] = [];

  /**
   * Household whose account collection has already
   * been hydrated during the current application runtime.
   */
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
   * Creates and persists a new account.
   *
   * Undefined is returned when the account does not
   * belong to the active household or storage fails.
   */
  static create(
    account: Account
  ): Account | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId ||
      account.householdId !==
        this.initializedHouseholdId
    ) {
      return undefined;
    }

    const storedAccount =
      this.clone(account);

    const nextAccounts = [
      ...this.accounts.map(
        (item) =>
          this.clone(item)
      ),

      storedAccount,
    ];

    if (
      !this.persistAccounts(
        nextAccounts
      )
    ) {
      return undefined;
    }

    this.accounts =
      nextAccounts;

    return this.clone(
      storedAccount
    );
  }

  /**
   * Updates and persists an existing account.
   */
  static update(
    account: Account
  ): Account | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId ||
      account.householdId !==
        this.initializedHouseholdId
    ) {
      return undefined;
    }

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

    const nextAccounts =
      this.accounts.map(
        (item) =>
          this.clone(item)
      );

    nextAccounts[
      accountIndex
    ] = updatedAccount;

    if (
      !this.persistAccounts(
        nextAccounts
      )
    ) {
      return undefined;
    }

    this.accounts =
      nextAccounts;

    return this.clone(
      updatedAccount
    );
  }

  /**
   * Deletes and persists an account.
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

    const nextAccounts =
      this.accounts
        .filter(
          (item) =>
            item.id !== id
        )
        .map(
          (item) =>
            this.clone(item)
        );

    if (
      !this.persistAccounts(
        nextAccounts
      )
    ) {
      return false;
    }

    this.accounts =
      nextAccounts;

    return true;
  }

  /**
   * Replaces the active household account collection.
   *
   * Used by authenticated cloud snapshot restore on
   * browser refresh.
   */
  static replaceForHousehold(
    householdId: string,
    accounts: Account[]
  ): boolean {
    if (
      !householdId ||
      accounts.some(
        (account) =>
          account.householdId !==
          householdId
      )
    ) {
      return false;
    }

    const nextAccounts =
      accounts.map(
        (account) =>
          this.clone(account)
      );

    if (
      !this.persistAccounts(
        nextAccounts
      )
    ) {
      return false;
    }

    this.accounts =
      nextAccounts;
    this.initializedHouseholdId =
      householdId;

    return true;
  }

  /**
   * Hydrates accounts for the single active household.
   *
   * Demo accounts are created only when no account
   * storage record exists.
   *
   * Stored empty arrays remain empty and are not seeded.
   * Invalid or unsupported stored records are left
   * untouched and are not replaced with demo data.
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

    const loadResult =
      loadStoredData<
        SerializedAccount[]
      >(
        HFOS_STORAGE_KEYS.accounts,

        (
          value
        ): value is SerializedAccount[] =>
          this.isSerializedAccountArray(
            value
          )
      );

    if (
      loadResult.status ===
      "loaded"
    ) {
      const hydratedAccounts =
        (
          loadResult.data ?? []
        ).map(
          (account) =>
            this.deserializeAccount(
              account
            )
        );

      const belongsToActiveHousehold =
        hydratedAccounts.every(
          (account) =>
            account.householdId ===
            household.id
        );

      this.accounts =
        belongsToActiveHousehold
          ? hydratedAccounts
          : [];

      this.initializedHouseholdId =
        household.id;

      return;
    }

    if (
      loadResult.status ===
      "missing"
    ) {
      const owner =
        HouseholdMemberService
          .getOwnerMember();

      const ownerMemberId =
        owner?.id ??
        "member-001";

      const demoAccounts =
        this.createDemoAccounts(
          household.id,
          ownerMemberId
        );

      this.accounts =
        demoAccounts;

      this.initializedHouseholdId =
        household.id;

      this.persistAccounts(
        demoAccounts
      );

      return;
    }

    this.accounts = [];

    this.initializedHouseholdId =
      household.id;
  }

  /**
   * Persists the complete account collection.
   */
  private static persistAccounts(
    accounts: Account[]
  ): boolean {
    const serializedAccounts =
      accounts.map(
        (account) =>
          this.serializeAccount(
            account
          )
      );

    const result =
      saveStoredData(
        HFOS_STORAGE_KEYS.accounts,
        serializedAccounts
      );

    return result.success;
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
        baseCurrency: "PHP",
        exchangeRate: 1,

        openingBalance: 50000,
        currentBalance: 125000,
        openingBaseBalance: 50000,
        currentBaseBalance: 125000,

        accountNumber:
          "****1234",

        isActive: true,

        createdAt:
          new Date(createdAt),

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
        baseCurrency: "PHP",
        exchangeRate: 1,

        openingBalance: 5000,
        currentBalance: 12750,
        openingBaseBalance: 5000,
        currentBaseBalance: 12750,

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
        baseCurrency: "PHP",
        exchangeRate: 1,

        openingBalance: 3000,
        currentBalance: 3000,
        openingBaseBalance: 3000,
        currentBaseBalance: 3000,

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
   * Converts an account into its JSON-safe form.
   */
  private static serializeAccount(
    account: Account
  ): SerializedAccount {
    return {
      ...account,

      paymentDueDate:
        account.paymentDueDate
          ? account.paymentDueDate.toISOString()
          : undefined,

      exchangeRateEffectiveDate:
        account.exchangeRateEffectiveDate
          ? account.exchangeRateEffectiveDate.toISOString()
          : undefined,

      createdAt:
        account.createdAt.toISOString(),

      updatedAt:
        account.updatedAt.toISOString(),
    };
  }

  /**
   * Restores account Date properties.
   */
  private static deserializeAccount(
    account: SerializedAccount
  ): Account {
    const currency =
      account.currency || "PHP";

    const baseCurrency =
      account.baseCurrency ??
      currency;

    const exchangeRate =
      account.exchangeRate ?? 1;

    return {
      ...account,

      currency,
      baseCurrency,
      exchangeRate,
      openingBaseBalance:
        account.openingBaseBalance ??
        account.openingBalance *
          exchangeRate,
      currentBaseBalance:
        account.currentBaseBalance ??
        account.currentBalance *
          exchangeRate,

      paymentDueDate:
        account.paymentDueDate
          ? new Date(
              account.paymentDueDate
            )
          : undefined,

      exchangeRateEffectiveDate:
        account.exchangeRateEffectiveDate
          ? new Date(
              account.exchangeRateEffectiveDate
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

      exchangeRateEffectiveDate:
        account.exchangeRateEffectiveDate
          ? new Date(
              account.exchangeRateEffectiveDate
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

  /**
   * Validates the serialized account collection before
   * any records are hydrated.
   */
  private static isSerializedAccountArray(
    value: unknown
  ): value is SerializedAccount[] {
    return (
      Array.isArray(value) &&
      value.every(
        (account) =>
          this.isSerializedAccount(
            account
          )
      )
    );
  }

  /**
   * Validates one serialized account.
   */
  private static isSerializedAccount(
    value: unknown
  ): value is SerializedAccount {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.id ===
        "string" &&
      typeof value.householdId ===
        "string" &&
      typeof value.ownerMemberId ===
        "string" &&
      this.isAccountVisibility(
        value.visibility
      ) &&
      typeof value.name ===
        "string" &&
      this.isOptionalString(
        value.institution
      ) &&
      this.isAccountClass(
        value.accountClass
      ) &&
      this.isAccountType(
        value.type
      ) &&
      typeof value.currency ===
        "string" &&
      this.isOptionalString(
        value.baseCurrency
      ) &&
      this.isOptionalFiniteNumber(
        value.exchangeRate
      ) &&
      this.isOptionalDateString(
        value.exchangeRateEffectiveDate
      ) &&
      this.isFiniteNumber(
        value.openingBalance
      ) &&
      this.isFiniteNumber(
        value.currentBalance
      ) &&
      this.isOptionalFiniteNumber(
        value.openingBaseBalance
      ) &&
      this.isOptionalFiniteNumber(
        value.currentBaseBalance
      ) &&
      this.isOptionalString(
        value.accountNumber
      ) &&
      this.isOptionalFiniteNumber(
        value.creditLimit
      ) &&
      this.isOptionalFiniteNumber(
        value.statementBalance
      ) &&
      this.isOptionalFiniteNumber(
        value.minimumPayment
      ) &&
      this.isOptionalDateString(
        value.paymentDueDate
      ) &&
      typeof value.isActive ===
        "boolean" &&
      this.isDateString(
        value.createdAt
      ) &&
      this.isDateString(
        value.updatedAt
      )
    );
  }

  private static isAccountClass(
    value: unknown
  ): value is AccountClass {
    return (
      typeof value ===
        "string" &&
      accountClasses.includes(
        value as AccountClass
      )
    );
  }

  private static isAccountVisibility(
    value: unknown
  ): value is AccountVisibility {
    return (
      typeof value ===
        "string" &&
      accountVisibilities.includes(
        value as AccountVisibility
      )
    );
  }

  private static isAccountType(
    value: unknown
  ): value is AccountType {
    return (
      typeof value ===
        "string" &&
      accountTypes.includes(
        value as AccountType
      )
    );
  }

  private static isOptionalString(
    value: unknown
  ): value is string | undefined {
    return (
      value === undefined ||
      typeof value ===
        "string"
    );
  }

  private static isFiniteNumber(
    value: unknown
  ): value is number {
    return (
      typeof value ===
        "number" &&
      Number.isFinite(value)
    );
  }

  private static isOptionalFiniteNumber(
    value: unknown
  ): value is number | undefined {
    return (
      value === undefined ||
      this.isFiniteNumber(value)
    );
  }

  private static isDateString(
    value: unknown
  ): value is string {
    return (
      typeof value ===
        "string" &&
      !Number.isNaN(
        new Date(value).getTime()
      )
    );
  }

  private static isOptionalDateString(
    value: unknown
  ): value is string | undefined {
    return (
      value === undefined ||
      this.isDateString(value)
    );
  }

  private static isRecord(
    value: unknown
  ): value is Record<
    string,
    unknown
  > {
    return (
      typeof value ===
        "object" &&
      value !== null
    );
  }
}
