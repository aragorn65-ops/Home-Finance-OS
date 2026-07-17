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
  roundCurrencyAmount,
} from "../../../shared/utils/currencyConversion";

import type {
  SavingsActivity,
  SavingsActivityType,
} from "../models/SavingsActivity";

interface SerializedSavingsActivity
  extends Omit<
    SavingsActivity,
    | "activityDate"
    | "enteredAmount"
    | "enteredCurrency"
    | "goalCurrencyAmount"
    | "goalCurrency"
    | "baseCurrency"
    | "baseAmount"
    | "exchangeRate"
    | "exchangeRateEffectiveDate"
    | "createdAt"
    | "updatedAt"
  > {
  activityDate: string;
  enteredAmount?: number;
  enteredCurrency?: string;
  goalCurrencyAmount?: number;
  goalCurrency?: string;
  baseCurrency?: string;
  baseAmount?: number;
  exchangeRate?: number;
  exchangeRateEffectiveDate?: string;

  createdAt: string;
  updatedAt: string;
}

const savingsActivityTypes:
  SavingsActivityType[] = [
    "contribution",
    "withdrawal",
    "adjustment",
  ];

export default class SavingsActivityRepository {
  /**
   * Hydrated savings activities for the single active
   * household.
   */
  private static savingsActivities:
    SavingsActivity[] = [];

  /**
   * Household whose savings-activity collection has
   * already been hydrated during the current application
   * runtime.
   */
  private static initializedHouseholdId:
    string | null = null;

  /**
   * Returns all savings activities.
   */
  static findAll(): SavingsActivity[] {
    this.ensureInitialized();

    return this.savingsActivities.map(
      (activity) =>
        this.clone(activity)
    );
  }

  /**
   * Finds a savings activity by ID.
   */
  static findById(
    id: string
  ): SavingsActivity | undefined {
    this.ensureInitialized();

    const activity =
      this.savingsActivities.find(
        (item) =>
          item.id === id
      );

    return activity
      ? this.clone(activity)
      : undefined;
  }

  /**
   * Returns activities belonging to one savings goal.
   */
  static findBySavingsGoalId(
    savingsGoalId: string
  ): SavingsActivity[] {
    this.ensureInitialized();

    return this.savingsActivities
      .filter(
        (activity) =>
          activity.savingsGoalId ===
          savingsGoalId
      )
      .map(
        (activity) =>
          this.clone(activity)
      );
  }

  /**
   * Returns activities belonging to one household.
   */
  static findByHouseholdId(
    householdId: string
  ): SavingsActivity[] {
    this.ensureInitialized();

    return this.savingsActivities
      .filter(
        (activity) =>
          activity.householdId ===
          householdId
      )
      .map(
        (activity) =>
          this.clone(activity)
      );
  }

  /**
   * Creates and persists a savings activity.
   *
   * Undefined is returned when the activity does not
   * belong to the active household, its ID already
   * exists, or storage fails.
   */
  static create(
    savingsActivity: SavingsActivity
  ): SavingsActivity | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId ||
      savingsActivity.householdId !==
        this.initializedHouseholdId
    ) {
      return undefined;
    }

    const alreadyExists =
      this.savingsActivities.some(
        (activity) =>
          activity.id ===
          savingsActivity.id
      );

    if (alreadyExists) {
      return undefined;
    }

    const storedActivity =
      this.clone(savingsActivity);

    const nextSavingsActivities = [
      ...this.savingsActivities.map(
        (activity) =>
          this.clone(activity)
      ),

      storedActivity,
    ];

    if (
      !this.persistSavingsActivities(
        nextSavingsActivities
      )
    ) {
      return undefined;
    }

    this.savingsActivities =
      nextSavingsActivities;

    return this.clone(
      storedActivity
    );
  }

  /**
   * Updates and persists an existing savings activity.
   */
  static update(
    savingsActivity: SavingsActivity
  ): SavingsActivity | undefined {
    this.ensureInitialized();

    if (
      !this.initializedHouseholdId ||
      savingsActivity.householdId !==
        this.initializedHouseholdId
    ) {
      return undefined;
    }

    const activityIndex =
      this.savingsActivities.findIndex(
        (activity) =>
          activity.id ===
          savingsActivity.id
      );

    if (
      activityIndex === -1
    ) {
      return undefined;
    }

    const updatedActivity =
      this.clone(savingsActivity);

    const nextSavingsActivities =
      this.savingsActivities.map(
        (activity) =>
          this.clone(activity)
      );

    nextSavingsActivities[
      activityIndex
    ] = updatedActivity;

    if (
      !this.persistSavingsActivities(
        nextSavingsActivities
      )
    ) {
      return undefined;
    }

    this.savingsActivities =
      nextSavingsActivities;

    return this.clone(
      updatedActivity
    );
  }

  /**
   * Deletes and persists a savings activity.
   *
   * Account-balance reversal and savings-balance rules
   * are enforced by the service layer before this method
   * is called.
   */
  static delete(
    id: string
  ): boolean {
    this.ensureInitialized();

    const activityExists =
      this.savingsActivities.some(
        (activity) =>
          activity.id === id
      );

    if (!activityExists) {
      return false;
    }

    const nextSavingsActivities =
      this.savingsActivities
        .filter(
          (activity) =>
            activity.id !== id
        )
        .map(
          (activity) =>
            this.clone(activity)
        );

    if (
      !this.persistSavingsActivities(
        nextSavingsActivities
      )
    ) {
      return false;
    }

    this.savingsActivities =
      nextSavingsActivities;

    return true;
  }

  /**
   * Hydrates savings activities for the single active
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
      this.savingsActivities = [];

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
        SerializedSavingsActivity[]
      >(
        HFOS_STORAGE_KEYS.savingsActivities,

        (
          value
        ): value is SerializedSavingsActivity[] =>
          this.isSerializedSavingsActivityArray(
            value
          )
      );

    if (
      loadResult.status ===
      "loaded"
    ) {
      const hydratedActivities =
        (
          loadResult.data ?? []
        ).map(
          (activity) =>
            this.deserializeSavingsActivity(
              activity
            )
        );

      const belongsToActiveHousehold =
        hydratedActivities.every(
          (activity) =>
            activity.householdId ===
            household.id
        );

      this.savingsActivities =
        belongsToActiveHousehold
          ? hydratedActivities
          : [];

      this.initializedHouseholdId =
        household.id;

      return;
    }

    if (
      loadResult.status ===
      "missing"
    ) {
      this.savingsActivities = [];

      this.initializedHouseholdId =
        household.id;

      this.persistSavingsActivities([]);

      return;
    }

    this.savingsActivities = [];

    this.initializedHouseholdId =
      household.id;
  }

  /**
   * Persists the complete savings-activity collection.
   */
  private static persistSavingsActivities(
    savingsActivities: SavingsActivity[]
  ): boolean {
    const serializedActivities =
      savingsActivities.map(
        (activity) =>
          this.serializeSavingsActivity(
            activity
          )
      );

    const result =
      saveStoredData(
        HFOS_STORAGE_KEYS.savingsActivities,
        serializedActivities
      );

    return result.success;
  }

  /**
   * Converts a savings activity into its JSON-safe form.
   */
  private static serializeSavingsActivity(
    savingsActivity: SavingsActivity
  ): SerializedSavingsActivity {
    return {
      ...savingsActivity,

      activityDate:
        savingsActivity.activityDate.toISOString(),

      exchangeRateEffectiveDate:
        savingsActivity.exchangeRateEffectiveDate
          .toISOString(),

      createdAt:
        savingsActivity.createdAt.toISOString(),

      updatedAt:
        savingsActivity.updatedAt.toISOString(),
    };
  }

  /**
   * Restores savings-activity Date properties.
   */
  private static deserializeSavingsActivity(
    savingsActivity: SerializedSavingsActivity
  ): SavingsActivity {
    const household =
      loadHousehold();

    const baseCurrency =
      normalizeCurrency(
        savingsActivity.baseCurrency,
        household?.currency ??
          "PHP"
      );

    const goalCurrency =
      normalizeCurrency(
        savingsActivity.goalCurrency,
        baseCurrency
      );

    const enteredCurrency =
      normalizeCurrency(
        savingsActivity.enteredCurrency,
        goalCurrency
      );

    const goalCurrencyAmount =
      savingsActivity.goalCurrencyAmount ??
      savingsActivity.amount;

    return {
      ...savingsActivity,

      enteredAmount:
        savingsActivity.enteredAmount ??
        savingsActivity.amount,

      enteredCurrency,

      goalCurrencyAmount:
        roundCurrencyAmount(
          goalCurrencyAmount
        ),

      goalCurrency,
      baseCurrency,

      baseAmount:
        savingsActivity.baseAmount ??
        roundCurrencyAmount(
          goalCurrencyAmount
        ),

      exchangeRate:
        savingsActivity.exchangeRate ?? 1,

      exchangeRateEffectiveDate:
        savingsActivity.exchangeRateEffectiveDate
          ? new Date(
              savingsActivity.exchangeRateEffectiveDate
            )
          : new Date(
              savingsActivity.activityDate
            ),

      activityDate:
        new Date(
          savingsActivity.activityDate
        ),

      createdAt:
        new Date(
          savingsActivity.createdAt
        ),

      updatedAt:
        new Date(
          savingsActivity.updatedAt
        ),
    };
  }

  /**
   * Returns a defensive savings-activity copy.
   */
  private static clone(
    savingsActivity: SavingsActivity
  ): SavingsActivity {
    return {
      ...savingsActivity,

      activityDate:
        new Date(
          savingsActivity.activityDate
        ),

      createdAt:
        new Date(
          savingsActivity.createdAt
        ),

      updatedAt:
        new Date(
          savingsActivity.updatedAt
        ),
    };
  }

  /**
   * Validates the serialized savings-activity collection
   * before records are hydrated.
   */
  private static isSerializedSavingsActivityArray(
    value: unknown
  ): value is SerializedSavingsActivity[] {
    return (
      Array.isArray(value) &&
      value.every(
        (activity) =>
          this.isSerializedSavingsActivity(
            activity
          )
      )
    );
  }

  /**
   * Validates one serialized savings activity.
   */
  private static isSerializedSavingsActivity(
    value: unknown
  ): value is SerializedSavingsActivity {
    if (!this.isRecord(value)) {
      return false;
    }

    return (
      typeof value.id ===
        "string" &&
      typeof value.householdId ===
        "string" &&
      typeof value.savingsGoalId ===
        "string" &&
      typeof value.memberId ===
        "string" &&
      this.isSavingsActivityType(
        value.activityType
      ) &&
      this.isFiniteNumber(
        value.amount
      ) &&
      (
        value.enteredAmount ===
          undefined ||
        this.isFiniteNumber(
          value.enteredAmount
        )
      ) &&
      this.isOptionalString(
        value.enteredCurrency
      ) &&
      (
        value.goalCurrencyAmount ===
          undefined ||
        this.isFiniteNumber(
          value.goalCurrencyAmount
        )
      ) &&
      this.isOptionalString(
        value.goalCurrency
      ) &&
      this.isOptionalString(
        value.baseCurrency
      ) &&
      (
        value.baseAmount ===
          undefined ||
        this.isFiniteNumber(
          value.baseAmount
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
      this.isDateString(
        value.activityDate
      ) &&
      this.isOptionalString(
        value.accountId
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

  private static isSavingsActivityType(
    value: unknown
  ): value is SavingsActivityType {
    return (
      typeof value ===
        "string" &&
      savingsActivityTypes.includes(
        value as SavingsActivityType
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
