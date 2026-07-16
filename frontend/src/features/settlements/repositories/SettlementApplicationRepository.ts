import type {
  SettlementApplication,
} from "../models/SettlementApplication";

import {
  loadHousehold,
} from "../../household/services/householdStorage";

import {
  HFOS_STORAGE_KEYS,
  loadStoredData,
  saveStoredData,
} from "../../../shared/storage/localStorageStore";

interface SerializedSettlementApplication
  extends Omit<
    SettlementApplication,
    | "createdAt"
    | "updatedAt"
  > {
  createdAt: string;
  updatedAt: string;
}

export default class SettlementApplicationRepository {
  /**
   * Hydrated settlement-application collection for the
   * single active household.
   */
  private static applications:
    SettlementApplication[] = [];

  /**
   * Household whose settlement applications have already
   * been hydrated during the current application runtime.
   */
  private static initializedHouseholdId:
    string | null = null;

  /**
   * Returns all settlement applications.
   */
  static findAll():
    SettlementApplication[] {
    this.ensureInitialized();

    return this.applications.map(
      (application) =>
        this.clone(application)
    );
  }

  /**
   * Finds a settlement application by ID.
   */
  static findById(
    id: string
  ): SettlementApplication | undefined {
    this.ensureInitialized();

    const application =
      this.applications.find(
        (item) =>
          item.id === id
      );

    return application
      ? this.clone(application)
      : undefined;
  }

  /**
   * Returns every application belonging to a settlement.
   */
  static findBySettlementId(
    settlementId: string
  ): SettlementApplication[] {
    this.ensureInitialized();

    return this.applications
      .filter(
        (application) =>
          application.settlementId ===
          settlementId
      )
      .map(
        (application) =>
          this.clone(application)
      );
  }

  /**
   * Returns every settlement application applied
   * to an expense allocation.
   */
  static findByExpenseAllocationId(
    expenseAllocationId: string
  ): SettlementApplication[] {
    this.ensureInitialized();

    return this.applications
      .filter(
        (application) =>
          application.expenseAllocationId ===
          expenseAllocationId
      )
      .map(
        (application) =>
          this.clone(application)
      );
  }

  /**
   * Returns the total amount applied from a settlement.
   */
  static getAppliedAmountBySettlementId(
    settlementId: string
  ): number {
    this.ensureInitialized();

    return this.applications
      .filter(
        (application) =>
          application.settlementId ===
          settlementId
      )
      .reduce(
        (total, application) =>
          total +
          application.appliedAmount,
        0
      );
  }

  /**
   * Returns the total amount paid toward
   * an expense allocation.
   */
  static getPaidAmountByExpenseAllocationId(
    expenseAllocationId: string
  ): number {
    this.ensureInitialized();

    return this.applications
      .filter(
        (application) =>
          application.expenseAllocationId ===
          expenseAllocationId
      )
      .reduce(
        (total, application) =>
          total +
          application.appliedAmount,
        0
      );
  }

  /**
   * Creates and persists one settlement application.
   *
   * Undefined is returned when storage is unavailable,
   * no household exists, or the ID already exists.
   */
  static create(
    application: SettlementApplication
  ): SettlementApplication | undefined {
    const created =
      this.createMany([
        application,
      ]);

    return created?.[0];
  }

  /**
   * Creates and persists multiple settlement applications.
   */
  static createMany(
    applications: SettlementApplication[]
  ): SettlementApplication[] | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId
    ) {
      return undefined;
    }

    const existingIds =
      new Set(
        this.applications.map(
          (application) =>
            application.id
        )
      );

    const incomingIds =
      new Set<string>();

    for (
      const application of
      applications
    ) {
      if (
        existingIds.has(
          application.id
        ) ||
        incomingIds.has(
          application.id
        )
      ) {
        return undefined;
      }

      incomingIds.add(
        application.id
      );
    }

    const storedApplications =
      applications.map(
        (application) =>
          this.clone(application)
      );

    const nextApplications = [
      ...this.applications.map(
        (application) =>
          this.clone(application)
      ),

      ...storedApplications,
    ];

    if (
      !this.persistApplications(
        nextApplications
      )
    ) {
      return undefined;
    }

    this.applications =
      nextApplications;

    return storedApplications.map(
      (application) =>
        this.clone(application)
    );
  }

  /**
   * Replaces and persists all applications belonging
   * to a settlement.
   *
   * Used when a settlement is edited.
   */
  static replaceBySettlementId(
    settlementId: string,
    applications: SettlementApplication[]
  ): SettlementApplication[] | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId
    ) {
      return undefined;
    }

    const retainedApplications =
      this.applications
        .filter(
          (application) =>
            application.settlementId !==
            settlementId
        )
        .map(
          (application) =>
            this.clone(application)
        );

    const retainedIds =
      new Set(
        retainedApplications.map(
          (application) =>
            application.id
        )
      );

    const incomingIds =
      new Set<string>();

    for (
      const application of
      applications
    ) {
      if (
        application.settlementId !==
          settlementId ||
        retainedIds.has(
          application.id
        ) ||
        incomingIds.has(
          application.id
        )
      ) {
        return undefined;
      }

      incomingIds.add(
        application.id
      );
    }

    const storedApplications =
      applications.map(
        (application) =>
          this.clone(application)
      );

    const nextApplications = [
      ...retainedApplications,
      ...storedApplications,
    ];

    if (
      !this.persistApplications(
        nextApplications
      )
    ) {
      return undefined;
    }

    this.applications =
      nextApplications;

    return storedApplications.map(
      (application) =>
        this.clone(application)
    );
  }

  /**
   * Deletes and persists all applications belonging
   * to a settlement.
   */
  static deleteBySettlementId(
    settlementId: string
  ): boolean {
    this.ensureInitialized();

    const originalCount =
      this.applications.length;

    const nextApplications =
      this.applications
        .filter(
          (application) =>
            application.settlementId !==
            settlementId
        )
        .map(
          (application) =>
            this.clone(application)
        );

    if (
      nextApplications.length ===
      originalCount
    ) {
      return false;
    }

    if (
      !this.persistApplications(
        nextApplications
      )
    ) {
      return false;
    }

    this.applications =
      nextApplications;

    return true;
  }

  /**
   * Deletes and persists all settlement applications
   * applied to an expense allocation.
   */
  static deleteByExpenseAllocationId(
    expenseAllocationId: string
  ): boolean {
    this.ensureInitialized();

    const originalCount =
      this.applications.length;

    const nextApplications =
      this.applications
        .filter(
          (application) =>
            application.expenseAllocationId !==
            expenseAllocationId
        )
        .map(
          (application) =>
            this.clone(application)
        );

    if (
      nextApplications.length ===
      originalCount
    ) {
      return false;
    }

    if (
      !this.persistApplications(
        nextApplications
      )
    ) {
      return false;
    }

    this.applications =
      nextApplications;

    return true;
  }

  /**
   * Deletes and persists one settlement application.
   */
  static delete(
    id: string
  ): boolean {
    this.ensureInitialized();

    const applicationExists =
      this.applications.some(
        (application) =>
          application.id === id
      );

    if (!applicationExists) {
      return false;
    }

    const nextApplications =
      this.applications
        .filter(
          (application) =>
            application.id !== id
        )
        .map(
          (application) =>
            this.clone(application)
        );

    if (
      !this.persistApplications(
        nextApplications
      )
    ) {
      return false;
    }

    this.applications =
      nextApplications;

    return true;
  }

  /**
   * Hydrates settlement applications for the single
   * active household.
   *
   * No demo application records currently exist.
   * Missing storage is initialized as an empty versioned
   * collection.
   *
   * Invalid or unsupported stored data remains untouched.
   */
  private static ensureInitialized():
    void {
    const household =
      loadHousehold();

    if (!household) {
      this.applications = [];

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
        SerializedSettlementApplication[]
      >(
        HFOS_STORAGE_KEYS
          .settlementApplications,

        (
          value
        ): value is SerializedSettlementApplication[] =>
          this.isSerializedApplicationArray(
            value
          )
      );

    if (
      loadResult.status ===
      "loaded"
    ) {
      this.applications =
        (
          loadResult.data ?? []
        ).map(
          (application) =>
            this.deserializeApplication(
              application
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
      this.applications = [];

      this.initializedHouseholdId =
        household.id;

      this.persistApplications(
        []
      );

      return;
    }

    this.applications = [];

    this.initializedHouseholdId =
      household.id;
  }

  /**
   * Persists the complete settlement-application
   * collection.
   */
  private static persistApplications(
    applications:
      SettlementApplication[]
  ): boolean {
    const serializedApplications =
      applications.map(
        (application) =>
          this.serializeApplication(
            application
          )
      );

    const result =
      saveStoredData(
        HFOS_STORAGE_KEYS
          .settlementApplications,

        serializedApplications
      );

    return result.success;
  }

  /**
   * Converts a settlement application into its
   * JSON-safe form.
   */
  private static serializeApplication(
    application:
      SettlementApplication
  ): SerializedSettlementApplication {
    return {
      ...application,

      createdAt:
        application.createdAt
          .toISOString(),

      updatedAt:
        application.updatedAt
          .toISOString(),
    };
  }

  /**
   * Restores settlement-application Date properties.
   */
  private static deserializeApplication(
    application:
      SerializedSettlementApplication
  ): SettlementApplication {
    return {
      ...application,

      createdAt:
        new Date(
          application.createdAt
        ),

      updatedAt:
        new Date(
          application.updatedAt
        ),
    };
  }

  /**
   * Returns a defensive settlement-application copy.
   */
  private static clone(
    application:
      SettlementApplication
  ): SettlementApplication {
    return {
      ...application,

      createdAt:
        new Date(
          application.createdAt
        ),

      updatedAt:
        new Date(
          application.updatedAt
        ),
    };
  }

  /**
   * Validates the serialized application collection
   * before hydration.
   */
  private static isSerializedApplicationArray(
    value: unknown
  ): value is
    SerializedSettlementApplication[] {
    return (
      Array.isArray(value) &&
      value.every(
        (application) =>
          this.isSerializedApplication(
            application
          )
      )
    );
  }

  /**
   * Validates one serialized settlement application.
   */
  private static isSerializedApplication(
    value: unknown
  ): value is
    SerializedSettlementApplication {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.id ===
        "string" &&
      typeof value.settlementId ===
        "string" &&
      typeof value.expenseAllocationId ===
        "string" &&
      this.isFiniteNumber(
        value.appliedAmount
      ) &&
      this.isDateString(
        value.createdAt
      ) &&
      this.isDateString(
        value.updatedAt
      )
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