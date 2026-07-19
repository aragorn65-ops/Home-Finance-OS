import {
  loadHousehold,
} from "../../household/services/householdStorage";

import {
  HFOS_STORAGE_KEYS,
  loadStoredData,
  saveStoredData,
} from "../../../shared/storage/localStorageStore";

import {
  normalizeCurrency,
  normalizeExchangeRate,
  roundCurrencyAmount,
} from "../../../shared/utils/currencyConversion";

import type {
  SavingsGoal,
  SavingsGoalPriority,
  SavingsGoalStatus,
  SavingsGoalType,
} from "../models/SavingsGoal";

interface SerializedSavingsGoal
  extends Omit<
    SavingsGoal,
    | "targetDate"
    | "goalCurrency"
    | "baseCurrency"
    | "targetBaseAmount"
    | "exchangeRate"
    | "exchangeRateEffectiveDate"
    | "createdAt"
    | "updatedAt"
  > {
  targetDate?: string;
  goalCurrency?: string;
  baseCurrency?: string;
  targetBaseAmount?: number;
  exchangeRate?: number;
  exchangeRateEffectiveDate?: string;

  createdAt: string;
  updatedAt: string;
}

const savingsGoalTypes:
  SavingsGoalType[] = [
    "emergency-fund",
    "vacation",
    "annual-insurance",
    "home-repair",
    "tuition",
    "vehicle-maintenance",
    "appliance-replacement",
    "general",
    "other",
  ];

const savingsGoalPriorities:
  SavingsGoalPriority[] = [
    "low",
    "medium",
    "high",
    "critical",
  ];

const savingsGoalStatuses:
  SavingsGoalStatus[] = [
    "not-started",
    "in-progress",
    "completed",
    "paused",
    "archived",
  ];

export default class SavingsGoalRepository {
  /**
   * Hydrated savings goals for the single active
   * household.
   */
  private static savingsGoals:
    SavingsGoal[] = [];

  /**
   * Household whose savings-goal collection has already
   * been hydrated during the current application runtime.
   */
  private static initializedHouseholdId:
    string | null = null;

  /**
   * Returns all savings goals.
   */
  static findAll(): SavingsGoal[] {
    this.ensureInitialized();

    return this.savingsGoals.map(
      (goal) =>
        this.clone(goal)
    );
  }

  /**
   * Finds a savings goal by ID.
   */
  static findById(
    id: string
  ): SavingsGoal | undefined {
    this.ensureInitialized();

    const goal =
      this.savingsGoals.find(
        (item) =>
          item.id === id
      );

    return goal
      ? this.clone(goal)
      : undefined;
  }

  /**
   * Returns savings goals belonging to one household.
   */
  static findByHouseholdId(
    householdId: string
  ): SavingsGoal[] {
    this.ensureInitialized();

    return this.savingsGoals
      .filter(
        (goal) =>
          goal.householdId ===
          householdId
      )
      .map(
        (goal) =>
          this.clone(goal)
      );
  }

  /**
   * Creates and persists a savings goal.
   */
  static create(
    savingsGoal: SavingsGoal
  ): SavingsGoal | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId ||
      savingsGoal.householdId !==
        this.initializedHouseholdId
    ) {
      return undefined;
    }

    const alreadyExists =
      this.savingsGoals.some(
        (goal) =>
          goal.id ===
          savingsGoal.id
      );

    if (alreadyExists) {
      return undefined;
    }

    const storedGoal =
      this.clone(savingsGoal);

    const nextSavingsGoals = [
      ...this.savingsGoals.map(
        (goal) =>
          this.clone(goal)
      ),

      storedGoal,
    ];

    if (
      !this.persistSavingsGoals(
        nextSavingsGoals
      )
    ) {
      return undefined;
    }

    this.savingsGoals =
      nextSavingsGoals;

    return this.clone(
      storedGoal
    );
  }

  /**
   * Updates and persists an existing savings goal.
   */
  static update(
    savingsGoal: SavingsGoal
  ): SavingsGoal | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId ||
      savingsGoal.householdId !==
        this.initializedHouseholdId
    ) {
      return undefined;
    }

    const goalIndex =
      this.savingsGoals.findIndex(
        (goal) =>
          goal.id ===
          savingsGoal.id
      );

    if (goalIndex === -1) {
      return undefined;
    }

    const updatedGoal =
      this.clone(savingsGoal);

    const nextSavingsGoals =
      this.savingsGoals.map(
        (goal) =>
          this.clone(goal)
      );

    nextSavingsGoals[
      goalIndex
    ] = updatedGoal;

    if (
      !this.persistSavingsGoals(
        nextSavingsGoals
      )
    ) {
      return undefined;
    }

    this.savingsGoals =
      nextSavingsGoals;

    return this.clone(
      updatedGoal
    );
  }

  /**
   * Deletes and persists a savings goal.
   *
   * Savings activity dependency rules are enforced by the
   * service layer before this method is called.
   */
  static delete(
    id: string
  ): boolean {
    this.ensureInitialized();

    const goalExists =
      this.savingsGoals.some(
        (goal) =>
          goal.id === id
      );

    if (!goalExists) {
      return false;
    }

    const nextSavingsGoals =
      this.savingsGoals
        .filter(
          (goal) =>
            goal.id !== id
        )
        .map(
          (goal) =>
            this.clone(goal)
        );

    if (
      !this.persistSavingsGoals(
        nextSavingsGoals
      )
    ) {
      return false;
    }

    this.savingsGoals =
      nextSavingsGoals;

    return true;
  }

  /**
   * Hydrates savings goals for the single active
   * household.
   *
   * Missing storage is initialized with an empty array.
   * Stored empty arrays remain empty.
   *
   * Invalid or unsupported storage records are left
   * untouched and are not replaced.
   */
  private static ensureInitialized(): void {
    const household =
      loadHousehold();

    if (!household) {
      this.savingsGoals = [];

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
        SerializedSavingsGoal[]
      >(
        HFOS_STORAGE_KEYS.savingsGoals,

        (
          value
        ): value is SerializedSavingsGoal[] =>
          this.isSerializedSavingsGoalArray(
            value
          )
      );

    if (
      loadResult.status ===
      "loaded"
    ) {
      const hydratedGoals =
        (
          loadResult.data ?? []
        ).map(
          (goal) =>
            this.deserializeSavingsGoal(
              goal
            )
        );

      const belongsToActiveHousehold =
        hydratedGoals.every(
          (goal) =>
            goal.householdId ===
            household.id
        );

      this.savingsGoals =
        belongsToActiveHousehold
          ? hydratedGoals
          : [];

      this.initializedHouseholdId =
        household.id;

      return;
    }

    if (
      loadResult.status ===
      "missing"
    ) {
      this.savingsGoals = [];

      this.initializedHouseholdId =
        household.id;

      this.persistSavingsGoals([]);

      return;
    }

    this.savingsGoals = [];

    this.initializedHouseholdId =
      household.id;
  }

  /**
   * Persists the complete savings-goal collection.
   */
  private static persistSavingsGoals(
    savingsGoals: SavingsGoal[]
  ): boolean {
    const serializedGoals =
      savingsGoals.map(
        (goal) =>
          this.serializeSavingsGoal(
            goal
          )
      );

    const result =
      saveStoredData(
        HFOS_STORAGE_KEYS.savingsGoals,
        serializedGoals
      );

    return result.success;
  }

  /**
   * Converts a savings goal into its JSON-safe form.
   */
  private static serializeSavingsGoal(
    savingsGoal: SavingsGoal
  ): SerializedSavingsGoal {
    return {
      ...savingsGoal,

      targetDate:
        savingsGoal.targetDate
          ? savingsGoal.targetDate
              .toISOString()
          : undefined,

      exchangeRateEffectiveDate:
        savingsGoal.exchangeRateEffectiveDate
          .toISOString(),

      createdAt:
        savingsGoal.createdAt
          .toISOString(),

      updatedAt:
        savingsGoal.updatedAt
          .toISOString(),
    };
  }

  /**
   * Restores savings-goal Date properties.
   */
  private static deserializeSavingsGoal(
    savingsGoal: SerializedSavingsGoal
  ): SavingsGoal {
    const household =
      loadHousehold();

    const baseCurrency =
      normalizeCurrency(
        savingsGoal.baseCurrency,
        household?.currency ?? "PHP"
      );

    const goalCurrency =
      normalizeCurrency(
        savingsGoal.goalCurrency,
        baseCurrency
      );

    const exchangeRate =
      normalizeExchangeRate(
        savingsGoal.exchangeRate,
        goalCurrency,
        baseCurrency
      ) || 1;

    return {
      ...savingsGoal,

      goalCurrency,
      baseCurrency,

      targetBaseAmount:
        savingsGoal.targetBaseAmount ??
        (
          goalCurrency ===
          baseCurrency
            ? roundCurrencyAmount(
                savingsGoal.targetAmount
              )
            : roundCurrencyAmount(
                savingsGoal.targetAmount *
                  exchangeRate
              )
        ),

      exchangeRate,

      exchangeRateEffectiveDate:
        savingsGoal.exchangeRateEffectiveDate
          ? new Date(
              savingsGoal.exchangeRateEffectiveDate
            )
          : new Date(
              savingsGoal.createdAt
            ),

      targetDate:
        savingsGoal.targetDate
          ? new Date(
              savingsGoal.targetDate
            )
          : undefined,

      createdAt:
        new Date(
          savingsGoal.createdAt
        ),

      updatedAt:
        new Date(
          savingsGoal.updatedAt
        ),
    };
  }

  /**
   * Returns a defensive savings-goal copy.
   */
  private static clone(
    savingsGoal: SavingsGoal
  ): SavingsGoal {
    return {
      ...savingsGoal,

      targetDate:
        savingsGoal.targetDate
          ? new Date(
              savingsGoal.targetDate
            )
          : undefined,

      createdAt:
        new Date(
          savingsGoal.createdAt
        ),

      updatedAt:
        new Date(
          savingsGoal.updatedAt
        ),
    };
  }

  /**
   * Validates the serialized savings-goal collection
   * before records are hydrated.
   */
  private static isSerializedSavingsGoalArray(
    value: unknown
  ): value is SerializedSavingsGoal[] {
    return (
      Array.isArray(value) &&
      value.every(
        (goal) =>
          this.isSerializedSavingsGoal(
            goal
          )
      )
    );
  }

  /**
   * Validates one serialized savings goal.
   */
  private static isSerializedSavingsGoal(
    value: unknown
  ): value is SerializedSavingsGoal {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.id ===
        "string" &&
      typeof value.householdId ===
        "string" &&
      typeof value.name ===
        "string" &&
      this.isOptionalString(
        value.description
      ) &&
      this.isSavingsGoalType(
        value.goalType
      ) &&
      this.isFiniteNumber(
        value.targetAmount
      ) &&
      this.isOptionalString(
        value.goalCurrency
      ) &&
      this.isOptionalString(
        value.baseCurrency
      ) &&
      (
        value.targetBaseAmount ===
          undefined ||
        this.isFiniteNumber(
          value.targetBaseAmount
        )
      ) &&
      (
        value.exchangeRate ===
          undefined ||
        this.isFiniteNumber(
          value.exchangeRate
        )
      ) &&
      this.isOptionalDateString(
        value.exchangeRateEffectiveDate
      ) &&
      this.isOptionalDateString(
        value.targetDate
      ) &&
      this.isOptionalString(
        value.linkedAccountId
      ) &&
      this.isSavingsGoalPriority(
        value.priority
      ) &&
      this.isSavingsGoalStatus(
        value.status
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

  private static isSavingsGoalType(
    value: unknown
  ): value is SavingsGoalType {
    return (
      typeof value ===
        "string" &&
      savingsGoalTypes.includes(
        value as SavingsGoalType
      )
    );
  }

  private static isSavingsGoalPriority(
    value: unknown
  ): value is SavingsGoalPriority {
    return (
      typeof value ===
        "string" &&
      savingsGoalPriorities.includes(
        value as SavingsGoalPriority
      )
    );
  }

  private static isSavingsGoalStatus(
    value: unknown
  ): value is SavingsGoalStatus {
    return (
      typeof value ===
        "string" &&
      savingsGoalStatuses.includes(
        value as SavingsGoalStatus
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
