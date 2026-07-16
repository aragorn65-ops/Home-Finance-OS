import {
  HFOS_LEGACY_STORAGE_KEYS,
  HFOS_STORAGE_KEYS,
  removeLegacyStoredData,
  removeStoredData,
  type StorageWriteResult,
} from "../../../shared/storage/localStorageStore";

export interface ApplicationDataResetResult {
  success: boolean;

  errors: string[];
}

/**
 * Removes all locally persisted HFOS application data.
 *
 * Financial records are removed before the household
 * record so a partial failure is less likely to leave
 * orphaned data attached to a missing household.
 *
 * Repository in-memory state is intentionally cleared
 * by reloading the application after a successful reset.
 */
export function resetApplicationData():
  ApplicationDataResetResult {
  const errors: string[] = [];

  const removeCurrentRecord = (
    label: string,
    result: StorageWriteResult
  ): void => {
    if (result.success) {
      return;
    }

    errors.push(
      result.message ??
        `${label} could not be removed.`
    );
  };

  removeCurrentRecord(
    "Settlement applications",
    removeStoredData(
      HFOS_STORAGE_KEYS
        .settlementApplications
    )
  );

  removeCurrentRecord(
    "Settlements",
    removeStoredData(
      HFOS_STORAGE_KEYS.settlements
    )
  );

  removeCurrentRecord(
    "Expense allocations",
    removeStoredData(
      HFOS_STORAGE_KEYS
        .expenseAllocations
    )
  );

  removeCurrentRecord(
    "Transactions",
    removeStoredData(
      HFOS_STORAGE_KEYS.transactions
    )
  );

  removeCurrentRecord(
    "Savings activities",
    removeStoredData(
      HFOS_STORAGE_KEYS
        .savingsActivities
    )
  );

  removeCurrentRecord(
    "Savings goals",
    removeStoredData(
      HFOS_STORAGE_KEYS
        .savingsGoals
    )
  );

  removeCurrentRecord(
    "Accounts",
    removeStoredData(
      HFOS_STORAGE_KEYS.accounts
    )
  );

  removeCurrentRecord(
    "Household",
    removeStoredData(
      HFOS_STORAGE_KEYS.household
    )
  );

  removeCurrentRecord(
    "Legacy household",
    removeLegacyStoredData(
      HFOS_LEGACY_STORAGE_KEYS
        .household
    )
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