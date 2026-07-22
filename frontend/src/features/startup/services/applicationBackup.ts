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

const protectedBackupKind =
  "hfos-password-protected-backup";

const protectedBackupVersion = 1;

const protectedBackupIterations =
  210000;

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

export interface ApplicationBackupOptions {
  password?: string;
}

export interface ApplicationBackupSummary {
  householdName: string;

  authenticatedLinkStatus?:
    | "linked"
    | "unlinked";

  remoteHouseholdId?: string;

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

  passwordProtected?: boolean;
}

export interface ApplicationDataHealthSummary {
  householdName: string;

  authenticatedLinkStatus:
    | "linked"
    | "unlinked";

  remoteHouseholdId?: string;

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
  requiresPassword?: boolean;
};

type ParsedBackupResult =
  | {
      success: true;
      backup: unknown;
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

interface PasswordProtectedApplicationBackupFile {
  kind: typeof protectedBackupKind;

  backupVersion: number;

  app: "Home Finance OS";

  exportedAt: string;

  summary: ApplicationBackupSummary;

  encryption: {
    algorithm: "AES-GCM";
    kdf: "PBKDF2-SHA-256";
    iterations: number;
    salt: string;
    iv: string;
  };

  payload: string;
}

export async function createApplicationBackup(
  options: ApplicationBackupOptions = {}
): Promise<ApplicationBackupResult> {
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
    await validateApplicationBackup(
      json
    );

  if (!validation.success) {
    return {
      success: false,
      message:
        `Backup package failed integrity validation. ${validation.message}`,
    };
  }

  const password =
    options.password?.trim() ?? "";

  if (password) {
    const protectedBackup =
      await createPasswordProtectedBackup(
        json,
        password,
        exportedAt
      );

    if (!protectedBackup.success) {
      return protectedBackup;
    }

    return {
      success: true,
      filename:
        createBackupFilename(
          exportedAt,
          true
        ),
      json:
        protectedBackup.json,
    };
  }

  return {
    success: true,
    filename:
      createBackupFilename(
        exportedAt,
        false
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

export async function restoreApplicationBackup(
  json: string,
  password?: string
): Promise<ApplicationRestoreResult> {
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
    await validateApplicationBackup(
      json,
      password
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

export async function validateApplicationBackup(
  json: string,
  password?: string
): Promise<ValidatedBackupResult> {
  const parsed =
    parseBackupJson(json);

  if (!parsed.success) {
    return parsed;
  }

  if (
    isPasswordProtectedApplicationBackupFile(
      parsed.backup
    )
  ) {
    return validatePasswordProtectedBackup(
      parsed.backup,
      password
    );
  }

  const validation =
    validateBackupFile(
      parsed.backup as ApplicationBackupFile
    );

  if (!validation.success) {
    return validation;
  }

  return {
    ...validation,
    backup:
      parsed.backup as ApplicationBackupFile,
    summary:
      createBackupSummary(
        parsed.backup as ApplicationBackupFile
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
      parsed,
  };
}

async function createPasswordProtectedBackup(
  plainJson: string,
  password: string,
  exportedAt: Date
): Promise<
  | {
      success: true;
      json: string;
    }
  | ApplicationFailureResult
> {
  if (password.length < 8) {
    return {
      success: false,
      message:
        "Use a backup password with at least 8 characters.",
    };
  }

  const crypto =
    getBrowserCrypto();

  if (
    !crypto?.subtle ||
    typeof TextEncoder ===
      "undefined"
  ) {
    return {
      success: false,
      message:
        "This browser cannot create password-protected backups.",
    };
  }

  const salt =
    createRandomBytes(16);
  const iv =
    createRandomBytes(12);
  const key =
    await deriveBackupKey(
      password,
      salt,
      protectedBackupIterations
    );

  const encrypted =
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv:
          toArrayBuffer(iv),
      },
      key,
      toArrayBuffer(
        new TextEncoder().encode(
          plainJson
        )
      )
    );

  const protectedBackup:
    PasswordProtectedApplicationBackupFile = {
    kind:
      protectedBackupKind,
    backupVersion:
      protectedBackupVersion,
    app:
      "Home Finance OS",
    exportedAt:
      exportedAt.toISOString(),
    summary:
      createUnavailableProtectedSummary(
        exportedAt
      ),
    encryption: {
      algorithm: "AES-GCM",
      kdf: "PBKDF2-SHA-256",
      iterations:
        protectedBackupIterations,
      salt:
        bytesToBase64(salt),
      iv:
        bytesToBase64(iv),
    },
    payload:
      bytesToBase64(
        new Uint8Array(encrypted)
      ),
  };

  return {
    success: true,
    json:
      JSON.stringify(
        protectedBackup,
        null,
        2
      ),
  };
}

async function validatePasswordProtectedBackup(
  backup: PasswordProtectedApplicationBackupFile,
  password: string | undefined
): Promise<ValidatedBackupResult> {
  const metadataResult =
    validateProtectedBackupMetadata(
      backup
    );

  if (!metadataResult.success) {
    return metadataResult;
  }

  const normalizedPassword =
    password?.trim() ?? "";

  if (!normalizedPassword) {
    return {
      success: false,
      requiresPassword: true,
      message:
        "This backup is password protected. Enter its backup password to continue.",
    };
  }

  const decryptResult =
    await decryptPasswordProtectedBackup(
      backup,
      normalizedPassword
    );

  if (!decryptResult.success) {
    return decryptResult;
  }

  const parsed =
    parseBackupJson(
      decryptResult.json
    );

  if (!parsed.success) {
    return {
      success: false,
      message:
        "Password accepted, but the backup contents are not valid HFOS data.",
    };
  }

  const validation =
    validateBackupFile(
      parsed.backup as ApplicationBackupFile
    );

  if (!validation.success) {
    return validation;
  }

  const summary =
    createBackupSummary(
      parsed.backup as ApplicationBackupFile
    );

  return {
    success: true,
    message:
      "Password-protected backup file is valid.",
    backup:
      parsed.backup as ApplicationBackupFile,
    summary: {
      ...summary,
      passwordProtected: true,
    },
  };
}

function validateProtectedBackupMetadata(
  backup: PasswordProtectedApplicationBackupFile
): ApplicationRestoreResult {
  if (
    backup.kind !==
      protectedBackupKind ||
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
    protectedBackupVersion
  ) {
    return {
      success: false,
      message:
        "This protected HFOS backup version is not supported.",
    };
  }

  if (
    typeof backup.exportedAt !==
      "string" ||
    !isRecord(backup.encryption) ||
    typeof backup.payload !==
      "string"
  ) {
    return {
      success: false,
      message:
        "Protected backup file is missing required HFOS metadata.",
    };
  }

  if (
    backup.encryption.algorithm !==
      "AES-GCM" ||
    backup.encryption.kdf !==
      "PBKDF2-SHA-256" ||
    typeof backup.encryption.iterations !==
      "number" ||
    backup.encryption.iterations <
      100000 ||
    typeof backup.encryption.salt !==
      "string" ||
    typeof backup.encryption.iv !==
      "string"
  ) {
    return {
      success: false,
      message:
        "Protected backup encryption metadata is malformed.",
    };
  }

  if (
    !isBackupSummary(
      backup.summary
    )
  ) {
    return {
      success: false,
      message:
        "Protected backup summary is malformed.",
    };
  }

  return {
    success: true,
    message:
      "Protected backup metadata is valid.",
  };
}

async function decryptPasswordProtectedBackup(
  backup: PasswordProtectedApplicationBackupFile,
  password: string
): Promise<
  | {
      success: true;
      json: string;
    }
  | ApplicationFailureResult
> {
  const crypto =
    getBrowserCrypto();

  if (
    !crypto?.subtle ||
    typeof TextDecoder ===
      "undefined"
  ) {
    return {
      success: false,
      message:
        "This browser cannot restore password-protected backups.",
    };
  }

  try {
    const salt =
      base64ToBytes(
        backup.encryption.salt
      );
    const iv =
      base64ToBytes(
        backup.encryption.iv
      );
    const payload =
      base64ToBytes(
        backup.payload
      );
    const key =
      await deriveBackupKey(
        password,
        salt,
        backup.encryption
          .iterations
      );
    const decrypted =
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv:
            toArrayBuffer(iv),
        },
        key,
        toArrayBuffer(payload)
      );

    return {
      success: true,
      json:
        new TextDecoder().decode(
          decrypted
        ),
    };
  } catch {
    return {
      success: false,
      message:
        "Backup password was not correct, or the protected backup is damaged.",
    };
  }
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

  const householdRecord =
    backup.records[
      HFOS_STORAGE_KEYS.household
    ];

  if (
    !isBackupHouseholdRecord(
      householdRecord
    )
  ) {
    return {
      success: false,
      message:
        "Backup household record is malformed or has invalid authenticated-link metadata.",
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
  exportedAt: Date,
  isPasswordProtected: boolean
): string {
  const stamp =
    exportedAt
      .toISOString()
      .replace(/[:.]/g, "-");

  return isPasswordProtected
    ? `hfos-backup-protected-${stamp}.hfos-backup.json`
    : `hfos-backup-${stamp}.hfos-backup.json`;
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
  const authenticatedLink =
    getAuthenticatedLinkSummary(
      household
    );

  return {
    householdName,
    ...authenticatedLink,
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
  const authenticatedLink =
    getAuthenticatedLinkSummary(
      household
    );

  return {
    householdName,
    authenticatedLinkStatus:
      authenticatedLink
        .authenticatedLinkStatus,
    remoteHouseholdId:
      authenticatedLink
        .remoteHouseholdId,
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
    authenticatedLinkStatus:
      "unlinked",
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
  const optionalLinkStatusIsValid =
    value.authenticatedLinkStatus ===
      undefined ||
    value.authenticatedLinkStatus ===
      "linked" ||
    value.authenticatedLinkStatus ===
      "unlinked";
  const linkMetadataIsValid =
    isBackupSummaryLinkMetadataValid(
      value
    );

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
    optionalThemeIsValid &&
    optionalLinkStatusIsValid &&
    linkMetadataIsValid
  );
}

function isBackupSummaryLinkMetadataValid(
  value: Record<string, unknown>
): boolean {
  if (
    value.authenticatedLinkStatus ===
    "linked"
  ) {
    return isNonEmptyString(
      value.remoteHouseholdId
    );
  }

  if (
    value.authenticatedLinkStatus ===
      "unlinked" &&
    value.remoteHouseholdId !==
      undefined
  ) {
    return false;
  }

  return (
    value.remoteHouseholdId ===
      undefined ||
    isNonEmptyString(
      value.remoteHouseholdId
    )
  );
}

function isBackupHouseholdRecord(
  value: unknown
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.householdName ===
      "string" &&
    isBackupAuthenticatedLink(
      value.authenticatedLink
    )
  );
}

function isBackupAuthenticatedLink(
  value: unknown
): boolean {
  if (value === undefined) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(
      value.remoteHouseholdId
    ) &&
    isNonEmptyString(
      value.migrationId
    ) &&
    isNonEmptyString(
      value.ownerMemberId
    ) &&
    isNonEmptyString(
      value.linkedByUserId
    ) &&
    isNonEmptyString(
      value.linkedAt
    ) &&
    !Number.isNaN(
      new Date(
        value.linkedAt
      ).getTime()
    )
  );
}

function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function getAuthenticatedLinkSummary(
  household: unknown
): Pick<
  ApplicationDataHealthSummary,
  | "authenticatedLinkStatus"
  | "remoteHouseholdId"
> {
  if (
    !isRecord(household) ||
    !isRecord(
      household.authenticatedLink
    ) ||
    typeof household.authenticatedLink
      .remoteHouseholdId !==
      "string"
  ) {
    return {
      authenticatedLinkStatus:
        "unlinked",
    };
  }

  return {
    authenticatedLinkStatus:
      "linked",
    remoteHouseholdId:
      household.authenticatedLink
        .remoteHouseholdId,
  };
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

function createUnavailableProtectedSummary(
  exportedAt: Date
): ApplicationBackupSummary {
  return {
    householdName:
      "Protected backup",
    exportedAt:
      exportedAt.toISOString(),
    backupVersion,
    storageSchemaVersion:
      HFOS_STORAGE_SCHEMA_VERSION,
    accountCount: 0,
    transactionCount: 0,
    settlementCount: 0,
    savingsGoalCount: 0,
    passwordProtected: true,
  };
}

async function deriveBackupKey(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<CryptoKey> {
  const crypto =
    getBrowserCrypto();

  if (
    !crypto?.subtle ||
    typeof TextEncoder ===
      "undefined"
  ) {
    throw new Error(
      "Browser crypto is unavailable."
    );
  }

  const baseKey =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(
        password
      ),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt:
        toArrayBuffer(salt),
      iterations,
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

function createRandomBytes(
  length: number
): Uint8Array {
  const crypto =
    getBrowserCrypto();
  const bytes =
    new Uint8Array(length);

  if (!crypto) {
    throw new Error(
      "Browser crypto is unavailable."
    );
  }

  crypto.getRandomValues(bytes);

  return bytes;
}

function bytesToBase64(
  bytes: Uint8Array
): string {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(
      byte
    );
  });

  return btoa(binary);
}

function base64ToBytes(
  value: string
): Uint8Array {
  const binary =
    atob(value);
  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let index = 0;
    index < binary.length;
    index += 1
  ) {
    bytes[index] =
      binary.charCodeAt(index);
  }

  return bytes;
}

function toArrayBuffer(
  bytes: Uint8Array
): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset +
      bytes.byteLength
  ) as ArrayBuffer;
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

function getBrowserCrypto():
  Crypto | null {
  if (
    typeof globalThis ===
      "undefined" ||
    !globalThis.crypto
  ) {
    return null;
  }

  return globalThis.crypto;
}

function isPasswordProtectedApplicationBackupFile(
  value: unknown
): value is PasswordProtectedApplicationBackupFile {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.kind ===
      protectedBackupKind &&
    value.app ===
      "Home Finance OS"
  );
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
