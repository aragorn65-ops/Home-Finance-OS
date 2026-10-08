export const HFOS_STORAGE_SCHEMA_VERSION = 1;

export const HFOS_STORAGE_KEYS = {
  household: "hfos.v1.household",

  accounts: "hfos.v1.accounts",

  memberPersonalAccounts:
    "hfos.v1.member-personal-accounts",

  transactions: "hfos.v1.transactions",

  expenseAllocations:
    "hfos.v1.expense-allocations",

  settlements: "hfos.v1.settlements",

  settlementApplications:
    "hfos.v1.settlement-applications",

  providerBills:
    "hfos.v1.provider-bills",

  savingsGoals:
    "hfos.v1.savings-goals",

  savingsActivities:
    "hfos.v1.savings-activities",
} as const;

export const HFOS_LEGACY_STORAGE_KEYS = {
  household: "hfos.household",
} as const;

export type HfosStorageKey =
  (typeof HFOS_STORAGE_KEYS)[
    keyof typeof HFOS_STORAGE_KEYS
  ];

export type HfosLegacyStorageKey =
  (typeof HFOS_LEGACY_STORAGE_KEYS)[
    keyof typeof HFOS_LEGACY_STORAGE_KEYS
  ];

export type StorageLoadStatus =
  | "loaded"
  | "missing"
  | "invalid"
  | "unsupported-version"
  | "unavailable";

export interface StorageLoadResult<T> {
  status: StorageLoadStatus;

  data?: T;

  schemaVersion?: number;

  message?: string;
}

export interface StorageWriteResult {
  success: boolean;

  message?: string;
}

interface StorageEnvelope<T> {
  schemaVersion: number;

  savedAt: string;

  data: T;
}

/**
 * Loads and validates a versioned HFOS storage record.
 *
 * Missing, malformed, unsupported, and unavailable
 * storage states remain distinct so repositories do not
 * accidentally reseed or overwrite existing user data.
 */
export function loadStoredData<T>(
  key: HfosStorageKey,
  isValidData: (
    value: unknown
  ) => value is T
): StorageLoadResult<T> {
  const storage =
    getBrowserStorage();

  if (!storage) {
    return {
      status: "unavailable",

      message:
        "Browser local storage is unavailable.",
    };
  }

  let json: string | null;

  try {
    json = storage.getItem(key);
  } catch {
    return {
      status: "unavailable",

      message:
        "Browser local storage could not be read.",
    };
  }

  if (json === null) {
    return {
      status: "missing",
    };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      status: "invalid",

      message:
        "Stored data contains malformed JSON.",
    };
  }

  if (!isStorageEnvelope(parsed)) {
    return {
      status: "invalid",

      message:
        "Stored data does not use the expected HFOS storage format.",
    };
  }

  if (
    parsed.schemaVersion !==
    HFOS_STORAGE_SCHEMA_VERSION
  ) {
    return {
      status:
        "unsupported-version",

      schemaVersion:
        parsed.schemaVersion,

      message:
        "Stored data uses an unsupported schema version.",
    };
  }

  if (!isValidData(parsed.data)) {
    return {
      status: "invalid",

      schemaVersion:
        parsed.schemaVersion,

      message:
        "Stored data does not match the expected repository structure.",
    };
  }

  return {
    status: "loaded",

    schemaVersion:
      parsed.schemaVersion,

    data:
      parsed.data,
  };
}

/**
 * Loads an unversioned legacy JSON value.
 *
 * This supports controlled migration without deleting or
 * modifying the legacy record during the read operation.
 */
export function loadLegacyStoredData<T>(
  key: HfosLegacyStorageKey,
  isValidData: (
    value: unknown
  ) => value is T
): StorageLoadResult<T> {
  const storage =
    getBrowserStorage();

  if (!storage) {
    return {
      status: "unavailable",

      message:
        "Browser local storage is unavailable.",
    };
  }

  let json: string | null;

  try {
    json = storage.getItem(key);
  } catch {
    return {
      status: "unavailable",

      message:
        "Browser local storage could not be read.",
    };
  }

  if (json === null) {
    return {
      status: "missing",
    };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      status: "invalid",

      message:
        "Legacy stored data contains malformed JSON.",
    };
  }

  if (!isValidData(parsed)) {
    return {
      status: "invalid",

      message:
        "Legacy stored data does not match the expected structure.",
    };
  }

  return {
    status: "loaded",

    data:
      parsed,
  };
}

/**
 * Saves one repository payload inside the current
 * versioned HFOS storage envelope.
 */
export function saveStoredData<T>(
  key: HfosStorageKey,
  data: T
): StorageWriteResult {
  const storage =
    getBrowserStorage();

  if (!storage) {
    return {
      success: false,

      message:
        "Browser local storage is unavailable.",
    };
  }

  const envelope: StorageEnvelope<T> = {
    schemaVersion:
      HFOS_STORAGE_SCHEMA_VERSION,

    savedAt:
      new Date().toISOString(),

    data,
  };

  let json: string;

  try {
    json =
      JSON.stringify(envelope);
  } catch {
    return {
      success: false,

      message:
        "HFOS data could not be serialized.",
    };
  }

  try {
    storage.setItem(
      key,
      json
    );

    return {
      success: true,
    };
  } catch {
    return {
      success: false,

      message:
        "HFOS data could not be written to browser local storage.",
    };
  }
}

/**
 * Removes one versioned HFOS storage record.
 */
export function removeStoredData(
  key: HfosStorageKey
): StorageWriteResult {
  const storage =
    getBrowserStorage();

  if (!storage) {
    return {
      success: false,

      message:
        "Browser local storage is unavailable.",
    };
  }

  try {
    storage.removeItem(key);

    return {
      success: true,
    };
  } catch {
    return {
      success: false,

      message:
        "HFOS data could not be removed from browser local storage.",
    };
  }
}

/**
 * Removes one legacy storage record after a successful,
 * explicitly controlled migration or reset.
 */
export function removeLegacyStoredData(
  key: HfosLegacyStorageKey
): StorageWriteResult {
  const storage =
    getBrowserStorage();

  if (!storage) {
    return {
      success: false,

      message:
        "Browser local storage is unavailable.",
    };
  }

  try {
    storage.removeItem(key);

    return {
      success: true,
    };
  } catch {
    return {
      success: false,

      message:
        "Legacy HFOS data could not be removed from browser local storage.",
    };
  }
}

/**
 * Returns browser local storage without allowing access
 * restrictions to crash application startup.
 */
function getBrowserStorage():
  Storage | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Checks the shared versioned storage envelope.
 *
 * Repository-specific validation is performed separately
 * against the envelope's data property.
 */
function isStorageEnvelope(
  value: unknown
): value is StorageEnvelope<unknown> {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.schemaVersion ===
      "number" &&
    Number.isInteger(
      value.schemaVersion
    ) &&
    typeof value.savedAt ===
      "string" &&
    "data" in value
  );
}

function isRecord(
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
