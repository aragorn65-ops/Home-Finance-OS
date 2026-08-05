import type {
  ExpenseAllocation,
} from "../models/ExpenseAllocation";

import {
  loadHousehold,
} from "../../household/services/householdStorage";

import {
  HFOS_STORAGE_KEYS,
  loadStoredData,
  saveStoredData,
} from "../../../shared/storage/localStorageStore";

interface SerializedExpenseAllocation
  extends Omit<
    ExpenseAllocation,
    | "createdAt"
    | "updatedAt"
  > {
  createdAt: string;
  updatedAt: string;
}

export default class ExpenseAllocationRepository {
  /**
   * Hydrated expense-allocation collection for the
   * single active household.
   */
  private static allocations:
    ExpenseAllocation[] = [];

  /**
   * Household whose allocation collection has already
   * been hydrated during the current application runtime.
   */
  private static initializedHouseholdId:
    string | null = null;

  /**
   * Returns all expense allocations.
   */
  static findAll():
    ExpenseAllocation[] {
    this.ensureInitialized();

    return this.allocations.map(
      (allocation) =>
        this.clone(allocation)
    );
  }

  /**
   * Finds an expense allocation by ID.
   */
  static findById(
    id: string
  ): ExpenseAllocation | undefined {
    this.ensureInitialized();

    const allocation =
      this.allocations.find(
        (item) =>
          item.id === id
      );

    return allocation
      ? this.clone(allocation)
      : undefined;
  }

  /**
   * Returns every allocation belonging to a transaction.
   */
  static findByTransactionId(
    transactionId: string
  ): ExpenseAllocation[] {
    this.ensureInitialized();

    return this.allocations
      .filter(
        (allocation) =>
          allocation.transactionId ===
          transactionId
      )
      .map(
        (allocation) =>
          this.clone(allocation)
      );
  }

  /**
   * Returns every allocation assigned to a member.
   */
  static findByMemberId(
    memberId: string
  ): ExpenseAllocation[] {
    this.ensureInitialized();

    return this.allocations
      .filter(
        (allocation) =>
          allocation.memberId ===
          memberId
      )
      .map(
        (allocation) =>
          this.clone(allocation)
      );
  }

  /**
   * Returns allocations for expenses paid by a member.
   */
  static findByPaidByMemberId(
    paidByMemberId: string
  ): ExpenseAllocation[] {
    this.ensureInitialized();

    return this.allocations
      .filter(
        (allocation) =>
          allocation.paidByMemberId ===
          paidByMemberId
      )
      .map(
        (allocation) =>
          this.clone(allocation)
      );
  }

  /**
   * Creates and persists multiple expense allocations.
   *
   * Undefined is returned when storage fails, the active
   * household is unavailable, or an allocation ID already
   * exists.
   */
  static createMany(
    allocations: ExpenseAllocation[]
  ): ExpenseAllocation[] | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId
    ) {
      return undefined;
    }

    const existingIds =
      new Set(
        this.allocations.map(
          (allocation) =>
            allocation.id
        )
      );

    const incomingIds =
      new Set<string>();

    for (
      const allocation of
      allocations
    ) {
      if (
        existingIds.has(
          allocation.id
        ) ||
        incomingIds.has(
          allocation.id
        )
      ) {
        return undefined;
      }

      incomingIds.add(
        allocation.id
      );
    }

    const storedAllocations =
      allocations.map(
        (allocation) =>
          this.clone(allocation)
      );

    const nextAllocations = [
      ...this.allocations.map(
        (allocation) =>
          this.clone(allocation)
      ),

      ...storedAllocations,
    ];

    if (
      !this.persistAllocations(
        nextAllocations
      )
    ) {
      return undefined;
    }

    this.allocations =
      nextAllocations;

    return storedAllocations.map(
      (allocation) =>
        this.clone(allocation)
    );
  }

  /**
   * Replaces and persists all allocations belonging
   * to a transaction.
   *
   * Used when an expense transaction is edited.
   */
  static replaceByTransactionId(
    transactionId: string,
    allocations: ExpenseAllocation[]
  ): ExpenseAllocation[] | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId
    ) {
      return undefined;
    }

    const retainedAllocations =
      this.allocations
        .filter(
          (allocation) =>
            allocation.transactionId !==
            transactionId
        )
        .map(
          (allocation) =>
            this.clone(allocation)
        );

    const retainedIds =
      new Set(
        retainedAllocations.map(
          (allocation) =>
            allocation.id
        )
      );

    const incomingIds =
      new Set<string>();

    for (
      const allocation of
      allocations
    ) {
      if (
        allocation.transactionId !==
          transactionId ||
        retainedIds.has(
          allocation.id
        ) ||
        incomingIds.has(
          allocation.id
        )
      ) {
        return undefined;
      }

      incomingIds.add(
        allocation.id
      );
    }

    const storedAllocations =
      allocations.map(
        (allocation) =>
          this.clone(allocation)
      );

    const nextAllocations = [
      ...retainedAllocations,
      ...storedAllocations,
    ];

    if (
      !this.persistAllocations(
        nextAllocations
      )
    ) {
      return undefined;
    }

    this.allocations =
      nextAllocations;

    return storedAllocations.map(
      (allocation) =>
      this.clone(allocation)
    );
  }

  /**
   * Replaces all allocations whose transactions belong
   * to the active household.
   *
   * Used when restoring cloud-backed core snapshots.
   */
  static replaceForHousehold(
    householdId: string,
    allocations: ExpenseAllocation[]
  ): boolean {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId ||
      this.initializedHouseholdId !==
        householdId
    ) {
      return false;
    }

    const incomingIds =
      new Set<string>();

    for (const allocation of allocations) {
      if (
        incomingIds.has(allocation.id)
      ) {
        return false;
      }

      incomingIds.add(
        allocation.id
      );
    }

    const nextAllocations =
      allocations.map(
        (allocation) =>
          this.clone(allocation)
      );

    if (
      !this.persistAllocations(
        nextAllocations
      )
    ) {
      return false;
    }

    this.allocations =
      nextAllocations;

    return true;
  }

  /**
   * Deletes and persists all allocations belonging
   * to a transaction.
   */
  static deleteByTransactionId(
    transactionId: string
  ): boolean {
    this.ensureInitialized();

    const originalCount =
      this.allocations.length;

    const nextAllocations =
      this.allocations
        .filter(
          (allocation) =>
            allocation.transactionId !==
            transactionId
        )
        .map(
          (allocation) =>
            this.clone(allocation)
        );

    if (
      nextAllocations.length ===
      originalCount
    ) {
      return false;
    }

    if (
      !this.persistAllocations(
        nextAllocations
      )
    ) {
      return false;
    }

    this.allocations =
      nextAllocations;

    return true;
  }

  /**
   * Deletes and persists one allocation.
   */
  static delete(
    id: string
  ): boolean {
    this.ensureInitialized();

    const allocationExists =
      this.allocations.some(
        (allocation) =>
          allocation.id === id
      );

    if (!allocationExists) {
      return false;
    }

    const nextAllocations =
      this.allocations
        .filter(
          (allocation) =>
            allocation.id !== id
        )
        .map(
          (allocation) =>
            this.clone(allocation)
        );

    if (
      !this.persistAllocations(
        nextAllocations
      )
    ) {
      return false;
    }

    this.allocations =
      nextAllocations;

    return true;
  }

  /**
   * Hydrates the expense-allocation collection.
   *
   * No demo allocation records currently exist.
   * A missing storage key is initialized as an empty
   * versioned collection.
   *
   * Invalid or unsupported stored data remains untouched.
   */
  private static ensureInitialized():
    void {
    const household =
      loadHousehold();

    if (!household) {
      this.allocations = [];

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
        SerializedExpenseAllocation[]
      >(
        HFOS_STORAGE_KEYS
          .expenseAllocations,

        (
          value
        ): value is SerializedExpenseAllocation[] =>
          this.isSerializedAllocationArray(
            value
          )
      );

    if (
      loadResult.status ===
      "loaded"
    ) {
      this.allocations =
        (
          loadResult.data ?? []
        ).map(
          (allocation) =>
            this.deserializeAllocation(
              allocation
            )
        );

      this.initializedHouseholdId =
        household.id;

      return;
    }

    if (
      loadResult.status ===
      "missing"
    ) {
      this.allocations = [];

      this.initializedHouseholdId =
        household.id;

      this.persistAllocations(
        []
      );

      return;
    }

    this.allocations = [];

    this.initializedHouseholdId =
      household.id;
  }

  /**
   * Persists the complete allocation collection.
   */
  private static persistAllocations(
    allocations:
      ExpenseAllocation[]
  ): boolean {
    const serializedAllocations =
      allocations.map(
        (allocation) =>
          this.serializeAllocation(
            allocation
          )
      );

    const result =
      saveStoredData(
        HFOS_STORAGE_KEYS
          .expenseAllocations,

        serializedAllocations
      );

    return result.success;
  }

  /**
   * Converts an allocation into its JSON-safe form.
   */
  private static serializeAllocation(
    allocation: ExpenseAllocation
  ): SerializedExpenseAllocation {
    return {
      ...allocation,

      personalItems:
        allocation.personalItems?.map(
          (item) => ({
            ...item,
          })
        ),

      createdAt:
        allocation.createdAt
          .toISOString(),

      updatedAt:
        allocation.updatedAt
          .toISOString(),
    };
  }

  /**
   * Restores allocation Date properties.
   */
  private static deserializeAllocation(
    allocation:
      SerializedExpenseAllocation
  ): ExpenseAllocation {
    return {
      ...allocation,

      personalItems:
        allocation.personalItems?.map(
          (item) => ({
            ...item,
          })
        ),

      createdAt:
        new Date(
          allocation.createdAt
        ),

      updatedAt:
        new Date(
          allocation.updatedAt
        ),
    };
  }

  /**
   * Returns a defensive allocation copy.
   */
  private static clone(
    allocation: ExpenseAllocation
  ): ExpenseAllocation {
    return {
      ...allocation,

      personalItems:
        allocation.personalItems?.map(
          (item) => ({
            ...item,
          })
        ),

      createdAt:
        new Date(
          allocation.createdAt
        ),

      updatedAt:
        new Date(
          allocation.updatedAt
        ),
    };
  }

  /**
   * Validates the serialized allocation collection
   * before hydration.
   */
  private static isSerializedAllocationArray(
    value: unknown
  ): value is
    SerializedExpenseAllocation[] {
    return (
      Array.isArray(value) &&
      value.every(
        (allocation) =>
          this.isSerializedAllocation(
            allocation
          )
      )
    );
  }

  /**
   * Validates one serialized allocation.
   */
  private static isSerializedAllocation(
    value: unknown
  ): value is
    SerializedExpenseAllocation {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.id ===
        "string" &&
      typeof value.transactionId ===
        "string" &&
      typeof value.paidByMemberId ===
        "string" &&
      typeof value.memberId ===
        "string" &&
      typeof value.isIncluded ===
        "boolean" &&
      this.isFiniteNumber(
        value.allocatedAmount
      ) &&
      this.isOptionalFiniteNumber(
        value.personalAmount
      ) &&
      this.isOptionalPersonalItemArray(
        value.personalItems
      ) &&
      this.isOptionalString(
        value.notes
      ) &&
      this.isDateString(
        value.createdAt
      ) &&
      this.isDateString(
        value.updatedAt
      )
    );
  }

  private static isOptionalPersonalItemArray(
    value: unknown
  ): boolean {
    if (value === undefined) {
      return true;
    }

    if (!Array.isArray(value)) {
      return false;
    }

    return value.every(
      (item) => {
        if (!this.isRecord(item)) {
          return false;
        }

        return (
          typeof item.id ===
            "string" &&
          typeof item.description ===
            "string" &&
          this.isFiniteNumber(
            item.amount
          )
        );
      }
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
