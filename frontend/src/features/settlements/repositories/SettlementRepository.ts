import type {
  Settlement,
  SettlementApplicationMethod,
} from "../models/Settlement";

import {
  loadHousehold,
} from "../../household/services/householdStorage";

import {
  HFOS_STORAGE_KEYS,
  loadStoredData,
  saveStoredData,
} from "../../../shared/storage/localStorageStore";

interface SerializedSettlement
  extends Omit<
    Settlement,
    | "settlementDate"
    | "createdAt"
    | "updatedAt"
  > {
  settlementDate: string;

  createdAt: string;
  updatedAt: string;
}

const applicationMethods:
  SettlementApplicationMethod[] = [
    "oldest-first",
    "manual",
  ];

export default class SettlementRepository {
  /**
   * Hydrated settlement collection for the single
   * active household.
   */
  private static settlements:
    Settlement[] = [];

  /**
   * Household whose settlements have already been
   * hydrated during the current application runtime.
   */
  private static initializedHouseholdId:
    string | null = null;

  /**
   * Returns all settlement records.
   */
  static findAll(): Settlement[] {
    this.ensureInitialized();

    return this.settlements.map(
      (settlement) =>
        this.clone(settlement)
    );
  }

  /**
   * Finds a settlement by ID.
   */
  static findById(
    id: string
  ): Settlement | undefined {
    this.ensureInitialized();

    const settlement =
      this.settlements.find(
        (item) =>
          item.id === id
      );

    return settlement
      ? this.clone(settlement)
      : undefined;
  }

  /**
   * Returns all settlements belonging
   * to a household.
   */
  static findByHouseholdId(
    householdId: string
  ): Settlement[] {
    this.ensureInitialized();

    return this.settlements
      .filter(
        (settlement) =>
          settlement.householdId ===
          householdId
      )
      .map(
        (settlement) =>
          this.clone(settlement)
      );
  }

  /**
   * Returns active settlements belonging
   * to a household.
   */
  static findActiveByHouseholdId(
    householdId: string
  ): Settlement[] {
    this.ensureInitialized();

    return this.settlements
      .filter(
        (settlement) =>
          settlement.householdId ===
            householdId &&
          settlement.isActive
      )
      .map(
        (settlement) =>
          this.clone(settlement)
      );
  }

  /**
   * Returns settlements paid by a member.
   */
  static findByFromMemberId(
    fromMemberId: string
  ): Settlement[] {
    this.ensureInitialized();

    return this.settlements
      .filter(
        (settlement) =>
          settlement.fromMemberId ===
          fromMemberId
      )
      .map(
        (settlement) =>
          this.clone(settlement)
      );
  }

  /**
   * Returns settlements received by a member.
   */
  static findByToMemberId(
    toMemberId: string
  ): Settlement[] {
    this.ensureInitialized();

    return this.settlements
      .filter(
        (settlement) =>
          settlement.toMemberId ===
          toMemberId
      )
      .map(
        (settlement) =>
          this.clone(settlement)
      );
  }

  /**
   * Returns settlements transferred
   * between two members.
   */
  static findBetweenMembers(
    householdId: string,
    fromMemberId: string,
    toMemberId: string
  ): Settlement[] {
    this.ensureInitialized();

    return this.settlements
      .filter(
        (settlement) =>
          settlement.householdId ===
            householdId &&
          settlement.fromMemberId ===
            fromMemberId &&
          settlement.toMemberId ===
            toMemberId
      )
      .map(
        (settlement) =>
          this.clone(settlement)
      );
  }

  /**
   * Creates and persists a settlement record.
   *
   * Undefined is returned when the settlement does not
   * belong to the active household, its ID already exists,
   * or storage fails.
   */
  static create(
    settlement: Settlement
  ): Settlement | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId ||
      settlement.householdId !==
        this.initializedHouseholdId
    ) {
      return undefined;
    }

    const duplicateId =
      this.settlements.some(
        (item) =>
          item.id === settlement.id
      );

    if (duplicateId) {
      return undefined;
    }

    const storedSettlement =
      this.clone(settlement);

    const nextSettlements = [
      ...this.settlements.map(
        (item) =>
          this.clone(item)
      ),

      storedSettlement,
    ];

    if (
      !this.persistSettlements(
        nextSettlements
      )
    ) {
      return undefined;
    }

    this.settlements =
      nextSettlements;

    return this.clone(
      storedSettlement
    );
  }

  /**
   * Updates and persists an existing settlement record.
   */
  static update(
    settlement: Settlement
  ): Settlement | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId ||
      settlement.householdId !==
        this.initializedHouseholdId
    ) {
      return undefined;
    }

    const settlementIndex =
      this.settlements.findIndex(
        (item) =>
          item.id === settlement.id
      );

    if (
      settlementIndex === -1
    ) {
      return undefined;
    }

    const storedSettlement =
      this.clone(settlement);

    const nextSettlements =
      this.settlements.map(
        (item) =>
          this.clone(item)
      );

    nextSettlements[
      settlementIndex
    ] = storedSettlement;

    if (
      !this.persistSettlements(
        nextSettlements
      )
    ) {
      return undefined;
    }

    this.settlements =
      nextSettlements;

    return this.clone(
      storedSettlement
    );
  }

  /**
   * Deletes and persists a settlement record.
   */
  static delete(
    id: string
  ): boolean {
    this.ensureInitialized();

    const settlementExists =
      this.settlements.some(
        (settlement) =>
          settlement.id === id
      );

    if (!settlementExists) {
      return false;
    }

    const nextSettlements =
      this.settlements
        .filter(
          (settlement) =>
            settlement.id !== id
        )
        .map(
          (settlement) =>
            this.clone(settlement)
        );

    if (
      !this.persistSettlements(
        nextSettlements
      )
    ) {
      return false;
    }

    this.settlements =
      nextSettlements;

    return true;
  }

  /**
   * Hydrates settlements for the single active household.
   *
   * No demo settlement records currently exist.
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
      this.settlements = [];

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
        SerializedSettlement[]
      >(
        HFOS_STORAGE_KEYS
          .settlements,

        (
          value
        ): value is SerializedSettlement[] =>
          this.isSerializedSettlementArray(
            value
          )
      );

    if (
      loadResult.status ===
      "loaded"
    ) {
      const hydratedSettlements =
        (
          loadResult.data ?? []
        ).map(
          (settlement) =>
            this.deserializeSettlement(
              settlement
            )
        );

      const belongsToActiveHousehold =
        hydratedSettlements.every(
          (settlement) =>
            settlement.householdId ===
            household.id
        );

      this.settlements =
        belongsToActiveHousehold
          ? hydratedSettlements
          : [];

      this.initializedHouseholdId =
        household.id;

      return;
    }

    if (
      loadResult.status ===
      "missing"
    ) {
      this.settlements = [];

      this.initializedHouseholdId =
        household.id;

      this.persistSettlements(
        []
      );

      return;
    }

    this.settlements = [];

    this.initializedHouseholdId =
      household.id;
  }

  /**
   * Persists the complete settlement collection.
   */
  private static persistSettlements(
    settlements: Settlement[]
  ): boolean {
    const serializedSettlements =
      settlements.map(
        (settlement) =>
          this.serializeSettlement(
            settlement
          )
      );

    const result =
      saveStoredData(
        HFOS_STORAGE_KEYS
          .settlements,

        serializedSettlements
      );

    return result.success;
  }

  /**
   * Converts a settlement into its JSON-safe form.
   */
  private static serializeSettlement(
    settlement: Settlement
  ): SerializedSettlement {
    return {
      ...settlement,

      settlementDate:
        settlement.settlementDate
          .toISOString(),

      createdAt:
        settlement.createdAt
          .toISOString(),

      updatedAt:
        settlement.updatedAt
          .toISOString(),
    };
  }

  /**
   * Restores settlement Date properties.
   */
  private static deserializeSettlement(
    settlement:
      SerializedSettlement
  ): Settlement {
    return {
      ...settlement,

      settlementDate:
        new Date(
          settlement.settlementDate
        ),

      createdAt:
        new Date(
          settlement.createdAt
        ),

      updatedAt:
        new Date(
          settlement.updatedAt
        ),
    };
  }

  /**
   * Returns a defensive settlement copy.
   */
  private static clone(
    settlement: Settlement
  ): Settlement {
    return {
      ...settlement,

      settlementDate:
        new Date(
          settlement.settlementDate
        ),

      createdAt:
        new Date(
          settlement.createdAt
        ),

      updatedAt:
        new Date(
          settlement.updatedAt
        ),
    };
  }

  /**
   * Validates the serialized settlement collection
   * before hydration.
   */
  private static isSerializedSettlementArray(
    value: unknown
  ): value is
    SerializedSettlement[] {
    return (
      Array.isArray(value) &&
      value.every(
        (settlement) =>
          this.isSerializedSettlement(
            settlement
          )
      )
    );
  }

  /**
   * Validates one serialized settlement.
   */
  private static isSerializedSettlement(
    value: unknown
  ): value is SerializedSettlement {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.id ===
        "string" &&
      typeof value.householdId ===
        "string" &&
      typeof value.fromMemberId ===
        "string" &&
      typeof value.toMemberId ===
        "string" &&
      this.isFiniteNumber(
        value.amount
      ) &&
      this.isDateString(
        value.settlementDate
      ) &&
      this.isOptionalString(
        value.sourceAccountId
      ) &&
      this.isOptionalString(
        value.destinationAccountId
      ) &&
      this.isApplicationMethod(
        value.applicationMethod
      ) &&
      this.isOptionalString(
        value.referenceNumber
      ) &&
      this.isOptionalString(
        value.notes
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

  private static isApplicationMethod(
    value: unknown
  ): value is
    SettlementApplicationMethod {
    return (
      typeof value ===
        "string" &&
      applicationMethods.includes(
        value as SettlementApplicationMethod
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