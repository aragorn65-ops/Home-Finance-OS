import {
  HFOS_STORAGE_KEYS,
  HFOS_STORAGE_SCHEMA_VERSION,
  saveStoredData,
  type HfosStorageKey,
} from "../../../shared/storage/localStorageStore";
import {
  getStoredThemePreference,
  storeThemePreference,
  type ThemePreference,
} from "../../../shared/theme/themePreference";

const backupKind =
  "hfos-local-backup";

const backupVersion = 1;

const themePreferenceKey =
  "themePreference";

const backupStorageKeys =
  Object.values(
    HFOS_STORAGE_KEYS
  ) as HfosStorageKey[];

const collectionKeys =
  new Set<HfosStorageKey>([
    HFOS_STORAGE_KEYS.accounts,
    HFOS_STORAGE_KEYS.transactions,
    HFOS_STORAGE_KEYS
      .expenseAllocations,
    HFOS_STORAGE_KEYS.settlements,
    HFOS_STORAGE_KEYS
      .settlementApplications,
    HFOS_STORAGE_KEYS.providerBills,
    HFOS_STORAGE_KEYS.savingsGoals,
    HFOS_STORAGE_KEYS
      .savingsActivities,
  ]);

const optionalBackupStorageKeys =
  new Set<HfosStorageKey>([
    HFOS_STORAGE_KEYS.providerBills,
  ]);

export interface ApplicationBackupResult {
  success: boolean;

  filename?: string;

  json?: string;

  message?: string;
}

export interface ApplicationBackupSummary {
  householdName: string;

  exportedAt: string;

  backupVersion?: number;

  storageSchemaVersion?: number;

  themePreference?: ThemePreference;

  accountCount: number;

  transactionCount: number;

  expenseAllocationCount?: number;

  settlementCount: number;

  settlementApplicationCount?: number;

  savingsGoalCount: number;

  savingsActivityCount?: number;

  providerBillCount?: number;
}

export interface ApplicationDataHealthSummary {
  householdName: string;

  storageSchemaVersion: number;

  themePreference: ThemePreference;

  accountCount: number;

  transactionCount: number;

  expenseAllocationCount: number;

  settlementCount: number;

  settlementApplicationCount: number;

  savingsGoalCount: number;

  savingsActivityCount: number;

  providerBillCount: number;

  isExportable: boolean;

  message: string;
}

export type ApplicationRestoreResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

type ApplicationFailureResult = {
  success: false;
  message: string;
};

type ParsedBackupResult =
  | {
      success: true;
      backup: ApplicationBackupFile;
    }
  | ApplicationFailureResult;

type ValidatedBackupResult =
  | {
      success: true;
      message: string;
      backup: ApplicationBackupFile;
      summary: ApplicationBackupSummary;
    }
  | ApplicationFailureResult;

interface StorageEnvelopeData {
  schemaVersion: number;

  savedAt: string;

  data: unknown;
}

interface ApplicationBackupFile {
  kind: typeof backupKind;

  backupVersion: number;

  app: "Home Finance OS";

  exportedAt: string;

  storageSchemaVersion: number;

  summary?: ApplicationBackupSummary;

  records: Partial<
    Record<HfosStorageKey, unknown>
  >;

  preferences: {
    [themePreferenceKey]?:
      ThemePreference;
  };
}

export function createApplicationBackup():
  ApplicationBackupResult {
  const storage =
    getLocalStorage();

  if (!storage) {
    return {
      success: false,
      message:
        "Browser local storage is unavailable.",
    };
  }

  const records:
    ApplicationBackupFile["records"] = {};

  for (const key of backupStorageKeys) {
    const readResult =
      readStoredEnvelopeData(
        storage,
        key
      );

    if (!readResult.success) {
      return {
        success: false,
        message:
          readResult.message,
      };
    }

    records[key] =
      readResult.data;
  }

  const exportedAt =
    new Date();

  const backup:
    ApplicationBackupFile = {
    kind:
      backupKind,
    backupVersion,
    app:
      "Home Finance OS",
    exportedAt:
      exportedAt.toISOString(),
    storageSchemaVersion:
      HFOS_STORAGE_SCHEMA_VERSION,
    records,
    preferences: {
      themePreference:
        getStoredThemePreference(),
    },
  };

  backup.summary =
    createBackupSummary(backup);

  const json =
    JSON.stringify(
      backup,
      null,
      2
    );

  const validation =
    validateApplicationBackup(
      json
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        `Backup package failed integrity validation. ${validation.message}`,
    };
  }

  return {
    success: true,
    filename:
      createBackupFilename(
        exportedAt
      ),
    json,
  };
}

export function getApplicationDataHealthSummary():
  ApplicationDataHealthSummary {
  const storage =
    getLocalStorage();

  if (!storage) {
    return createUnavailableDataHealthSummary(
      "Browser local storage is unavailable."
    );
  }

  const records:
    ApplicationBackupFile["records"] = {};

  for (const key of backupStorageKeys) {
    const readResult =
      readStoredEnvelopeData(
        storage,
        key
      );

    if (!readResult.success) {
      return createUnavailableDataHealthSummary(
        readResult.message
      );
    }

    records[key] =
      readResult.data;
  }

  return createDataHealthSummary(
    records
  );
}

export function restoreApplicationBackup(
  json: string
): ApplicationRestoreResult {
  const storage =
    getLocalStorage();

  if (!storage) {
    return {
      success: false,
      message:
        "Browser local storage is unavailable.",
    };
  }

  const validation =
    validateApplicationBackup(
      json
    );

  if (!validation.success) {
    return validation;
  }

  const backup =
    validation.backup;

  const recordsToRestore = {
    ...backup.records,

    [HFOS_STORAGE_KEYS.providerBills]:
      backup.records[
        HFOS_STORAGE_KEYS.providerBills
      ] ?? [],
  };

  const snapshot =
    createRestoreSnapshot(storage);

  for (const key of backupStorageKeys) {
    const writeResult =
      saveStoredData(
        key,
        recordsToRestore[key]
      );

    if (!writeResult.success) {
      restoreSnapshot(
        storage,
        snapshot
      );

      return {
        success: false,
        message:
          writeResult.message ??
          "Backup could not be restored.",
      };
    }
  }

  if (
    backup.preferences.themePreference
  ) {
    try {
      storeThemePreference(
        backup.preferences.themePreference
      );
    } catch {
      restoreSnapshot(
        storage,
        snapshot
      );

      return {
        success: false,
        message:
          "Backup theme preference could not be restored.",
      };
    }
  }

  return {
    success: true,
    message:
      "Backup restored successfully.",
  };
}

function createRestoreSnapshot(
  storage: Storage
): Map<string, string | null> {
  const snapshot =
    new Map<string, string | null>();

  backupStorageKeys.forEach((key) => {
    snapshot.set(
      key,
      storage.getItem(key)
    );
  });

  snapshot.set(
    "hfos.themePreference",
    storage.getItem(
      "hfos.themePreference"
    )
  );

  return snapshot;
}

function restoreSnapshot(
  storage: Storage,
  snapshot: Map<string, string | null>
): void {
  snapshot.forEach((value, key) => {
    if (value === null) {
      storage.removeItem(key);

      return;
    }

    storage.setItem(key, value);
  });
}

export function validateApplicationBackup(
  json: string
): ValidatedBackupResult {
  const parsed =
    parseBackupJson(json);

  if (!parsed.success) {
    return parsed;
  }

  const validation =
    validateBackupFile(
      parsed.backup
    );

  if (!validation.success) {
    return validation;
  }

  return {
    ...validation,
    backup:
      parsed.backup,
    summary:
      createBackupSummary(
        parsed.backup
      ),
  };
}

function readStoredEnvelopeData(
  storage: Storage,
  key: HfosStorageKey
):
  | {
      success: true;
      data: unknown;
    }
  | {
      success: false;
      message: string;
    } {
  const fallbackData =
    collectionKeys.has(key)
      ? []
      : null;

  const json =
    storage.getItem(key);

  if (json === null) {
    return {
      success: true,
      data:
        fallbackData,
    };
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(json);
  } catch {
    return {
      success: false,
      message:
        "Stored HFOS data contains malformed JSON and cannot be exported.",
    };
  }

  if (
    !isStorageEnvelopeData(parsed)
  ) {
    return {
      success: false,
      message:
        "Stored HFOS data does not use the expected format.",
    };
  }

  if (
    parsed.schemaVersion !==
    HFOS_STORAGE_SCHEMA_VERSION
  ) {
    return {
      success: false,
      message:
        "Stored HFOS data uses an unsupported schema version.",
    };
  }

  return {
    success: true,
    data:
      parsed.data,
  };
}

function parseBackupJson(
  json: string
): ParsedBackupResult {
  let parsed: unknown;

  try {
    parsed =
      JSON.parse(json);
  } catch {
    return {
      success: false,
      message:
        "Choose a valid JSON backup file.",
    };
  }

  if (!isRecord(parsed)) {
    return {
      success: false,
      message:
        "Backup file is not valid.",
    };
  }

  return {
    success: true,
    backup:
      parsed as unknown as
        ApplicationBackupFile,
  };
}

function validateBackupFile(
  backup: ApplicationBackupFile
): ApplicationRestoreResult {
  if (
    backup.kind !==
      backupKind ||
    backup.app !==
      "Home Finance OS"
  ) {
    return {
      success: false,
      message:
        "This file is not an HFOS backup.",
    };
  }

  if (
    backup.backupVersion !==
    backupVersion
  ) {
    return {
      success: false,
      message:
        "This HFOS backup version is not supported.",
    };
  }

  if (
    backup.storageSchemaVersion !==
    HFOS_STORAGE_SCHEMA_VERSION
  ) {
    return {
      success: false,
      message:
        "This HFOS storage schema version is not supported.",
    };
  }

  if (
    typeof backup.exportedAt !==
      "string" ||
    !isRecord(backup.records) ||
    !isRecord(backup.preferences)
  ) {
    return {
      success: false,
      message:
        "Backup file is missing required HFOS metadata.",
    };
  }

  for (const key of backupStorageKeys) {
    if (
      !(key in backup.records) &&
      !optionalBackupStorageKeys.has(key)
    ) {
      return {
        success: false,
        message:
          "Backup file is missing required HFOS records.",
      };
    }
  }

  if (
    !isRecord(
      backup.records[
        HFOS_STORAGE_KEYS.household
      ]
    )
  ) {
    return {
      success: false,
      message:
        "Backup household record is malformed.",
    };
  }

  for (const key of collectionKeys) {
    if (
      !(key in backup.records) &&
      optionalBackupStorageKeys.has(key)
    ) {
      continue;
    }

    if (
      !Array.isArray(
        backup.records[key]
      )
    ) {
      return {
        success: false,
        message:
          "Backup contains malformed financial records.",
      };
    }
  }

  const themePreference =
    backup.preferences.themePreference;

  if (
    themePreference &&
    themePreference !== "system" &&
    themePreference !== "light" &&
    themePreference !== "dark"
  ) {
    return {
      success: false,
      message:
        "Backup theme preference is malformed.",
    };
  }

  if (
    backup.summary &&
    !isBackupSummary(
      backup.summary
    )
  ) {
    return {
      success: false,
      message:
        "Backup summary is malformed.",
    };
  }

  return {
    success: true,
    message:
      "Backup file is valid.",
  };
}

function createBackupFilename(
  exportedAt: Date
): string {
  const stamp =
    exportedAt
      .toISOString()
      .replace(/[:.]/g, "-");

  return `hfos-backup-${stamp}.hfos-backup.json`;
}

function createBackupSummary(
  backup: ApplicationBackupFile
): ApplicationBackupSummary {
  if (
    backup.summary &&
    isBackupSummary(
      backup.summary
    )
  ) {
    return backup.summary;
  }

  const household =
    backup.records[
      HFOS_STORAGE_KEYS.household
    ];

  const householdName =
    isRecord(household) &&
    typeof household.householdName ===
      "string"
      ? household.householdName
      : "Unnamed household";

  return {
    householdName,
    exportedAt:
      backup.exportedAt,
    backupVersion:
      backup.backupVersion,
    storageSchemaVersion:
      backup.storageSchemaVersion,
    themePreference:
      backup.preferences
        .themePreference,
    accountCount:
      getCollectionCount(
        backup,
        HFOS_STORAGE_KEYS.accounts
      ),
    transactionCount:
      getCollectionCount(
        backup,
        HFOS_STORAGE_KEYS.transactions
      ),
    expenseAllocationCount:
      getCollectionCount(
        backup,
        HFOS_STORAGE_KEYS
          .expenseAllocations
      ),
    settlementCount:
      getCollectionCount(
        backup,
        HFOS_STORAGE_KEYS.settlements
      ),
    settlementApplicationCount:
      getCollectionCount(
        backup,
        HFOS_STORAGE_KEYS
          .settlementApplications
      ),
    savingsGoalCount:
      getCollectionCount(
        backup,
        HFOS_STORAGE_KEYS.savingsGoals
      ),
    savingsActivityCount:
      getCollectionCount(
        backup,
        HFOS_STORAGE_KEYS
          .savingsActivities
      ),
    providerBillCount:
      getCollectionCount(
        backup,
        HFOS_STORAGE_KEYS.providerBills
      ),
  };
}

function createDataHealthSummary(
  records: ApplicationBackupFile["records"]
): ApplicationDataHealthSummary {
  const household =
    records[
      HFOS_STORAGE_KEYS.household
    ];

  const householdName =
    isRecord(household) &&
    typeof household.householdName ===
      "string"
      ? household.householdName
      : "No household";

  const hasHousehold =
    isRecord(household);

  return {
    householdName,
    storageSchemaVersion:
      HFOS_STORAGE_SCHEMA_VERSION,
    themePreference:
      getStoredThemePreference(),
    accountCount:
      getRecordCollectionCount(
        records,
        HFOS_STORAGE_KEYS.accounts
      ),
    transactionCount:
      getRecordCollectionCount(
        records,
        HFOS_STORAGE_KEYS.transactions
      ),
    expenseAllocationCount:
      getRecordCollectionCount(
        records,
        HFOS_STORAGE_KEYS
          .expenseAllocations
      ),
    settlementCount:
      getRecordCollectionCount(
        records,
        HFOS_STORAGE_KEYS.settlements
      ),
    settlementApplicationCount:
      getRecordCollectionCount(
        records,
        HFOS_STORAGE_KEYS
          .settlementApplications
      ),
    savingsGoalCount:
      getRecordCollectionCount(
        records,
        HFOS_STORAGE_KEYS.savingsGoals
      ),
    savingsActivityCount:
      getRecordCollectionCount(
        records,
        HFOS_STORAGE_KEYS
          .savingsActivities
      ),
    providerBillCount:
      getRecordCollectionCount(
        records,
        HFOS_STORAGE_KEYS.providerBills
      ),
    isExportable:
      hasHousehold,
    message:
      hasHousehold
        ? "Current browser data is ready for local backup export."
        : "Create or restore a household before exporting a backup.",
  };
}

function createUnavailableDataHealthSummary(
  message: string
): ApplicationDataHealthSummary {
  return {
    householdName:
      "Unavailable",
    storageSchemaVersion:
      HFOS_STORAGE_SCHEMA_VERSION,
    themePreference:
      "system",
    accountCount: 0,
    transactionCount: 0,
    expenseAllocationCount: 0,
    settlementCount: 0,
    settlementApplicationCount: 0,
    savingsGoalCount: 0,
    savingsActivityCount: 0,
    providerBillCount: 0,
    isExportable: false,
    message,
  };
}

function isBackupSummary(
  value: unknown
): value is ApplicationBackupSummary {
  if (!isRecord(value)) {
    return false;
  }

  const optionalNumberFields = [
    "backupVersion",
    "storageSchemaVersion",
    "expenseAllocationCount",
    "settlementApplicationCount",
    "savingsActivityCount",
    "providerBillCount",
  ];

  const optionalNumbersAreValid =
    optionalNumberFields.every(
      (field) =>
        value[field] ===
          undefined ||
        (typeof value[field] ===
          "number" &&
          Number.isInteger(
            value[field]
          ) &&
          value[field] >= 0)
    );

  const optionalThemeIsValid =
    value.themePreference ===
      undefined ||
    value.themePreference ===
      "system" ||
    value.themePreference ===
      "light" ||
    value.themePreference ===
      "dark";

  return (
    typeof value.householdName ===
      "string" &&
    typeof value.exportedAt ===
      "string" &&
    typeof value.accountCount ===
      "number" &&
    Number.isInteger(
      value.accountCount
    ) &&
    value.accountCount >= 0 &&
    typeof value.transactionCount ===
      "number" &&
    Number.isInteger(
      value.transactionCount
    ) &&
    value.transactionCount >= 0 &&
    typeof value.settlementCount ===
      "number" &&
    Number.isInteger(
      value.settlementCount
    ) &&
    value.settlementCount >= 0 &&
    typeof value.savingsGoalCount ===
      "number" &&
    Number.isInteger(
      value.savingsGoalCount
    ) &&
    value.savingsGoalCount >= 0 &&
    optionalNumbersAreValid &&
    optionalThemeIsValid
  );
}

function getCollectionCount(
  backup: ApplicationBackupFile,
  key: HfosStorageKey
): number {
  const value =
    backup.records[key];

  return Array.isArray(value)
    ? value.length
    : 0;
}

function getRecordCollectionCount(
  records: ApplicationBackupFile["records"],
  key: HfosStorageKey
): number {
  const value =
    records[key];

  return Array.isArray(value)
    ? value.length
    : 0;
}

function getLocalStorage():
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

function isStorageEnvelopeData(
  value: unknown
): value is StorageEnvelopeData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.schemaVersion ===
      "number" &&
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
