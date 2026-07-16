import type {
  Transaction,
  TransactionType,
  TransactionVisibility,
} from "../models/Transaction";

import type {
  ExpenseSplitMethod,
} from "../models/ExpenseAllocation";

import type {
  StoredAttachment,
  StoredAttachmentCategory,
} from "../../../shared/models/StoredAttachment";

import AccountRepository from "../../accounts/repositories/AccountRepository";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import {
  loadHousehold,
} from "../../household/services/householdStorage";

import {
  HFOS_STORAGE_KEYS,
  loadStoredData,
  saveStoredData,
} from "../../../shared/storage/localStorageStore";

interface SerializedStoredAttachment
  extends Omit<
    StoredAttachment,
    "createdAt"
  > {
  createdAt: string;
}

interface SerializedTransaction
  extends Omit<
    Transaction,
    | "attachments"
    | "transactionDate"
    | "createdAt"
    | "updatedAt"
  > {
  attachments?:
    SerializedStoredAttachment[];

  transactionDate: string;

  createdAt: string;
  updatedAt: string;
}

const transactionTypes:
  TransactionType[] = [
    "income",
    "expense",
    "transfer",
  ];

const transactionVisibilities:
  TransactionVisibility[] = [
    "household",
    "participants",
    "private",
  ];

const expenseSplitMethods:
  ExpenseSplitMethod[] = [
    "none",
    "equal",
    "exact",
    "shared-personal",
    "submeter",
  ];

const storedAttachmentCategories:
  StoredAttachmentCategory[] = [
    "receipt",
    "bill",
    "other",
  ];

export default class TransactionRepository {
  /**
   * Hydrated transaction collection for the single
   * active household.
   */
  private static transactions:
    Transaction[] = [];

  /**
   * Household whose transactions have already been
   * hydrated during the current application runtime.
   */
  private static initializedHouseholdId:
    string | null = null;

  /**
   * Returns all transactions.
   */
  static findAll(): Transaction[] {
    this.ensureInitialized();

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
    this.ensureInitialized();

    const transaction =
      this.transactions.find(
        (item) =>
          item.id === id
      );

    return transaction
      ? this.clone(transaction)
      : undefined;
  }

  /**
   * Creates and persists a transaction.
   *
   * Undefined is returned when the transaction does not
   * belong to the active household, its ID already exists,
   * or storage fails.
   */
  static create(
    transaction: Transaction
  ): Transaction | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId ||
      transaction.householdId !==
        this.initializedHouseholdId
    ) {
      return undefined;
    }

    const duplicateId =
      this.transactions.some(
        (item) =>
          item.id === transaction.id
      );

    if (duplicateId) {
      return undefined;
    }

    const storedTransaction =
      this.clone(transaction);

    const nextTransactions = [
      ...this.transactions.map(
        (item) =>
          this.clone(item)
      ),

      storedTransaction,
    ];

    if (
      !this.persistTransactions(
        nextTransactions
      )
    ) {
      return undefined;
    }

    this.transactions =
      nextTransactions;

    return this.clone(
      storedTransaction
    );
  }

  /**
   * Updates and persists an existing transaction.
   */
  static update(
    id: string,
    transaction: Transaction
  ): Transaction | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId ||
      transaction.householdId !==
        this.initializedHouseholdId ||
      transaction.id !== id
    ) {
      return undefined;
    }

    const transactionIndex =
      this.transactions.findIndex(
        (item) =>
          item.id === id
      );

    if (
      transactionIndex === -1
    ) {
      return undefined;
    }

    const updatedTransaction =
      this.clone(transaction);

    const nextTransactions =
      this.transactions.map(
        (item) =>
          this.clone(item)
      );

    nextTransactions[
      transactionIndex
    ] = updatedTransaction;

    if (
      !this.persistTransactions(
        nextTransactions
      )
    ) {
      return undefined;
    }

    this.transactions =
      nextTransactions;

    return this.clone(
      updatedTransaction
    );
  }

  /**
   * Deletes and persists a transaction.
   */
  static delete(
    id: string
  ): boolean {
    this.ensureInitialized();

    const transactionExists =
      this.transactions.some(
        (item) =>
          item.id === id
      );

    if (!transactionExists) {
      return false;
    }

    const nextTransactions =
      this.transactions
        .filter(
          (item) =>
            item.id !== id
        )
        .map(
          (item) =>
            this.clone(item)
        );

    if (
      !this.persistTransactions(
        nextTransactions
      )
    ) {
      return false;
    }

    this.transactions =
      nextTransactions;

    return true;
  }

  /**
   * Hydrates transactions for the single active household.
   *
   * Demo records are created only when no transaction
   * storage record exists and the matching demo accounts
   * are available.
   *
   * Stored empty arrays remain empty.
   * Invalid or unsupported records remain untouched.
   */
  private static ensureInitialized(): void {
    const household =
      loadHousehold();

    if (!household) {
      this.transactions = [];

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
        SerializedTransaction[]
      >(
        HFOS_STORAGE_KEYS.transactions,

        (
          value
        ): value is SerializedTransaction[] =>
          this.isSerializedTransactionArray(
            value
          )
      );

    if (
      loadResult.status ===
      "loaded"
    ) {
      const hydratedTransactions =
        (
          loadResult.data ?? []
        ).map(
          (transaction) =>
            this.deserializeTransaction(
              transaction
            )
        );

      const belongsToActiveHousehold =
        hydratedTransactions.every(
          (transaction) =>
            transaction.householdId ===
            household.id
        );

      this.transactions =
        belongsToActiveHousehold
          ? hydratedTransactions
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

      const hasRequiredDemoAccounts =
        Boolean(
          AccountRepository.findById(
            "acc-001"
          )
        ) &&
        Boolean(
          AccountRepository.findById(
            "acc-002"
          )
        );

      const demoTransactions =
        hasRequiredDemoAccounts
          ? this.createDemoTransactions(
              household.id,
              ownerMemberId
            )
          : [];

      this.transactions =
        demoTransactions;

      this.initializedHouseholdId =
        household.id;

      this.persistTransactions(
        demoTransactions
      );

      return;
    }

    this.transactions = [];

    this.initializedHouseholdId =
      household.id;
  }

  /**
   * Persists the complete transaction collection.
   */
  private static persistTransactions(
    transactions: Transaction[]
  ): boolean {
    const serializedTransactions =
      transactions.map(
        (transaction) =>
          this.serializeTransaction(
            transaction
          )
      );

    const result =
      saveStoredData(
        HFOS_STORAGE_KEYS.transactions,
        serializedTransactions
      );

    return result.success;
  }

  /**
   * Creates the default transaction collection for the
   * active household.
   */
  private static createDemoTransactions(
    householdId: string,
    ownerMemberId: string
  ): Transaction[] {
    return [
      {
        id: "txn-001",
        householdId,

        createdByMemberId:
          ownerMemberId,

        visibility:
          "household",

        type: "income",
        amount: 75000,

        sourceAccountId: null,
        destinationAccountId:
          "acc-001",

        category: "Salary",

        description:
          "Monthly salary",

        notes: "",

        transactionDate:
          new Date(
            "2026-07-01T00:00:00"
          ),

        isActive: true,

        createdAt:
          new Date(
            "2026-07-01T08:00:00"
          ),

        updatedAt:
          new Date(
            "2026-07-01T08:00:00"
          ),
      },
      {
        id: "txn-002",
        householdId,

        createdByMemberId:
          ownerMemberId,

        visibility:
          "household",

        type: "expense",
        amount: 8500,

        sourceAccountId:
          "acc-001",

        destinationAccountId:
          null,

        category: "Housing",

        description:
          "Monthly rent",

        notes: "",

        transactionDate:
          new Date(
            "2026-07-02T00:00:00"
          ),

        isActive: true,

        createdAt:
          new Date(
            "2026-07-02T09:00:00"
          ),

        updatedAt:
          new Date(
            "2026-07-02T09:00:00"
          ),
      },
      {
        id: "txn-003",
        householdId,

        createdByMemberId:
          ownerMemberId,

        visibility:
          "household",

        type: "expense",
        amount: 3200,

        sourceAccountId:
          "acc-001",

        destinationAccountId:
          null,

        category: "Groceries",

        description:
          "Weekly groceries",

        notes: "",

        transactionDate:
          new Date(
            "2026-07-05T00:00:00"
          ),

        isActive: true,

        createdAt:
          new Date(
            "2026-07-05T14:30:00"
          ),

        updatedAt:
          new Date(
            "2026-07-05T14:30:00"
          ),
      },
      {
        id: "txn-004",
        householdId,

        createdByMemberId:
          ownerMemberId,

        visibility:
          "household",

        type: "transfer",
        amount: 5000,

        sourceAccountId:
          "acc-001",

        destinationAccountId:
          "acc-002",

        category:
          "Account Transfer",

        description:
          "Transfer to GCash",

        notes: "",

        transactionDate:
          new Date(
            "2026-07-07T00:00:00"
          ),

        isActive: true,

        createdAt:
          new Date(
            "2026-07-07T10:15:00"
          ),

        updatedAt:
          new Date(
            "2026-07-07T10:15:00"
          ),
      },
    ];
  }

  /**
   * Converts a transaction into its JSON-safe form.
   */
  private static serializeTransaction(
    transaction: Transaction
  ): SerializedTransaction {
    return {
      ...transaction,

      attachments:
        transaction.attachments?.map(
          (attachment) => ({
            ...attachment,

            createdAt:
              attachment.createdAt.toISOString(),
          })
        ) ?? [],

      transactionDate:
        transaction.transactionDate.toISOString(),

      createdAt:
        transaction.createdAt.toISOString(),

      updatedAt:
        transaction.updatedAt.toISOString(),
    };
  }

  /**
   * Restores transaction Date properties.
   */
  private static deserializeTransaction(
    transaction: SerializedTransaction
  ): Transaction {
    return {
      ...transaction,

      attachments:
        transaction.attachments?.map(
          (attachment) => ({
            ...attachment,

            createdAt:
              new Date(
                attachment.createdAt
              ),
          })
        ) ?? [],

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

  /**
   * Returns a defensive transaction copy.
   */
  private static clone(
    transaction: Transaction
  ): Transaction {
    return {
      ...transaction,

      attachments:
        transaction.attachments?.map(
          (attachment) => ({
            ...attachment,

            createdAt:
              new Date(
                attachment.createdAt
              ),
          })
        ) ?? [],

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

  /**
   * Validates the serialized transaction collection
   * before hydration.
   */
  private static isSerializedTransactionArray(
    value: unknown
  ): value is SerializedTransaction[] {
    return (
      Array.isArray(value) &&
      value.every(
        (transaction) =>
          this.isSerializedTransaction(
            transaction
          )
      )
    );
  }

  /**
   * Validates one serialized transaction.
   */
  private static isSerializedTransaction(
    value: unknown
  ): value is SerializedTransaction {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.id ===
        "string" &&
      typeof value.householdId ===
        "string" &&
      this.isOptionalString(
        value.createdByMemberId
      ) &&
      this.isOptionalString(
        value.paidByMemberId
      ) &&
      this.isOptionalExpenseSplitMethod(
        value.expenseSplitMethod
      ) &&
      this.isOptionalTransactionVisibility(
        value.visibility
      ) &&
      this.isTransactionType(
        value.type
      ) &&
      this.isFiniteNumber(
        value.amount
      ) &&
      this.isNullableString(
        value.sourceAccountId
      ) &&
      this.isNullableString(
        value.destinationAccountId
      ) &&
      typeof value.category ===
        "string" &&
      typeof value.description ===
        "string" &&
      typeof value.notes ===
        "string" &&
      this.isOptionalSerializedAttachmentArray(
        value.attachments
      ) &&
      this.isDateString(
        value.transactionDate
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

  private static isOptionalSerializedAttachmentArray(
    value: unknown
  ): value is
    | SerializedStoredAttachment[]
    | undefined {
    return (
      value === undefined ||
      (
        Array.isArray(value) &&
        value.every(
          (attachment) =>
            this.isSerializedStoredAttachment(
              attachment
            )
        )
      )
    );
  }

  private static isSerializedStoredAttachment(
    value: unknown
  ): value is SerializedStoredAttachment {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.id ===
        "string" &&
      this.isStoredAttachmentCategory(
        value.category
      ) &&
      typeof value.fileName ===
        "string" &&
      typeof value.mimeType ===
        "string" &&
      this.isFiniteNumber(
        value.sizeBytes
      ) &&
      value.sizeBytes >= 0 &&
      typeof value.dataUrl ===
        "string" &&
      this.isDateString(
        value.createdAt
      )
    );
  }

  private static isStoredAttachmentCategory(
    value: unknown
  ): value is StoredAttachmentCategory {
    return (
      typeof value ===
        "string" &&
      storedAttachmentCategories.includes(
        value as StoredAttachmentCategory
      )
    );
  }

  private static isTransactionType(
    value: unknown
  ): value is TransactionType {
    return (
      typeof value ===
        "string" &&
      transactionTypes.includes(
        value as TransactionType
      )
    );
  }

  private static isOptionalTransactionVisibility(
    value: unknown
  ): value is
    | TransactionVisibility
    | undefined {
    return (
      value === undefined ||
      (
        typeof value ===
          "string" &&
        transactionVisibilities.includes(
          value as TransactionVisibility
        )
      )
    );
  }

  private static isOptionalExpenseSplitMethod(
    value: unknown
  ): value is
    | ExpenseSplitMethod
    | undefined {
    return (
      value === undefined ||
      (
        typeof value ===
          "string" &&
        expenseSplitMethods.includes(
          value as ExpenseSplitMethod
        )
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

  private static isNullableString(
    value: unknown
  ): value is string | null {
    return (
      value === null ||
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