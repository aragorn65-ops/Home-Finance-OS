import {
  HFOS_LEGACY_STORAGE_KEYS,
  HFOS_STORAGE_KEYS,
  removeLegacyStoredData,
  removeStoredData,
  saveStoredData,
  type StorageWriteResult,
} from "../../../shared/storage/localStorageStore";

export interface ApplicationDataResetResult {
  success: boolean;

  errors: string[];
}

const hfosStorageKeyPrefix = "hfos.";

const resetPreservedLocalStorageKeys =
  new Set<string>([
    HFOS_STORAGE_KEYS.accounts,
    HFOS_STORAGE_KEYS.transactions,
    HFOS_STORAGE_KEYS
      .expenseAllocations,
    HFOS_STORAGE_KEYS.settlements,
    HFOS_STORAGE_KEYS
      .settlementApplications,
    HFOS_STORAGE_KEYS.savingsGoals,
    HFOS_STORAGE_KEYS
      .savingsActivities,
    "hfos.themePreference",
  ]);

const testDataResetPreservedLocalStorageKeys =
  new Set<string>([
    ...resetPreservedLocalStorageKeys,
    HFOS_STORAGE_KEYS.household,
  ]);

/**
 * Removes all locally persisted HFOS application data.
 *
 * Financial collections are cleared with explicit empty
 * storage records before the household record is removed.
 * This prevents repositories from treating the next
 * household setup as a first-run demo seed.
 *
 * Repository in-memory state is intentionally cleared
 * by reloading the application after a successful reset.
 */
export function resetApplicationData():
  ApplicationDataResetResult {
  const errors: string[] = [];

  clearFinancialCollections(
    errors
  );

  removeCurrentRecord(
    errors,
    "Household",
    removeStoredData(
      HFOS_STORAGE_KEYS.household
    )
  );

  removeCurrentRecord(
    errors,
    "Legacy household",
    removeLegacyStoredData(
      HFOS_LEGACY_STORAGE_KEYS
        .household
    )
  );

  clearUnknownHfosStorageKeys(
    errors,
    resetPreservedLocalStorageKeys
  );

  return {
    success:
      errors.length === 0,

    errors,
  };
}

/**
 * Clears financial/test records while keeping the active
 * household setup and local display preferences intact.
 */
export function resetHouseholdTestData():
  ApplicationDataResetResult {
  const errors: string[] = [];

  clearFinancialCollections(
    errors
  );

  clearUnknownHfosStorageKeys(
    errors,
    testDataResetPreservedLocalStorageKeys
  );

  return {
    success:
      errors.length === 0,

    errors,
  };
}

/**
 * Reloads HFOS after a successful reset so all static
 * repository state is discarded and household setup
 * becomes the active application flow.
 */
export function reloadAfterApplicationReset():
  void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.location.reload();
}

function clearUnknownHfosStorageKeys(
  errors: string[],
  preserveKeys: Set<string>
): void {
  clearStorageByPrefix({
    errors,
    label: "Additional HFOS local data",
    preserveKeys,
    storage:
      getStorage("localStorage"),
  });

  clearStorageByPrefix({
    errors,
    label: "HFOS session data",
    preserveKeys: new Set<string>(),
    storage:
      getStorage("sessionStorage"),
  });
}

function clearStorageByPrefix({
  errors,
  label,
  preserveKeys,
  storage,
}: {
  errors: string[];
  label: string;
  preserveKeys: Set<string>;
  storage: Storage | null;
}): void {
  if (!storage) {
    return;
  }

  try {
    const keysToRemove: string[] = [];

    for (
      let index = 0;
      index < storage.length;
      index += 1
    ) {
      const key =
        storage.key(index);

      if (
        key &&
        key.startsWith(
          hfosStorageKeyPrefix
        ) &&
        !preserveKeys.has(key)
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      storage.removeItem(key);
    });
  } catch {
    errors.push(
      `${label} could not be cleared.`
    );
  }
}

function clearFinancialCollections(
  errors: string[]
): void {
  clearCurrentCollection(
    errors,
    "Settlement applications",
    saveStoredData(
      HFOS_STORAGE_KEYS
        .settlementApplications,
      []
    )
  );

  clearCurrentCollection(
    errors,
    "Settlements",
    saveStoredData(
      HFOS_STORAGE_KEYS.settlements,
      []
    )
  );

  clearCurrentCollection(
    errors,
    "Expense allocations",
    saveStoredData(
      HFOS_STORAGE_KEYS
        .expenseAllocations,
      []
    )
  );

  clearCurrentCollection(
    errors,
    "Transactions",
    saveStoredData(
      HFOS_STORAGE_KEYS.transactions,
      []
    )
  );

  clearCurrentCollection(
    errors,
    "Savings activities",
    saveStoredData(
      HFOS_STORAGE_KEYS
        .savingsActivities,
      []
    )
  );

  clearCurrentCollection(
    errors,
    "Savings goals",
    saveStoredData(
      HFOS_STORAGE_KEYS
        .savingsGoals,
      []
    )
  );

  clearCurrentCollection(
    errors,
    "Accounts",
    saveStoredData(
      HFOS_STORAGE_KEYS.accounts,
      []
    )
  );
}

function clearCurrentCollection(
  errors: string[],
  label: string,
  result: StorageWriteResult
): void {
  if (result.success) {
    return;
  }

  errors.push(
    result.message ??
      `${label} could not be cleared.`
  );
}

function removeCurrentRecord(
  errors: string[],
  label: string,
  result: StorageWriteResult
): void {
  if (result.success) {
    return;
  }

  errors.push(
    result.message ??
      `${label} could not be removed.`
  );
}

function getStorage(
  storageName:
    | "localStorage"
    | "sessionStorage"
): Storage | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    return window[storageName];
  } catch {
    return null;
  }
}
