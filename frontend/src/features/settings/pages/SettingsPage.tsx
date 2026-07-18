import "./SettingsPage.css";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import {
  getCountryDefaults,
} from "../../../shared/data/countryDefaults";
import { countries } from "../../../shared/data/countries";
import { currencies } from "../../../shared/data/currencies";
import { timezones } from "../../../shared/data/timezones";
import {
  getStoredThemePreference,
  storeThemePreference,
  type ThemePreference,
} from "../../../shared/theme/themePreference";
import {
  loadHousehold,
  saveHouseholdPreferences,
} from "../../household/services/householdStorage";

import {
  reloadAfterApplicationReset,
  resetApplicationData,
  resetHouseholdTestData,
} from "../../startup/services/applicationDataReset";
import {
  createApplicationBackup,
  restoreApplicationBackup,
  validateApplicationBackup,
  type ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";
import TransactionService from "../../transactions/services/TransactionService";

const customPreferenceValue =
  "__custom__";

export default function SettingsPage() {
  const navigate =
    useNavigate();

  const household =
    loadHousehold();

  const backupFileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    themePreference,
    setThemePreference,
  ] = useState<ThemePreference>(
    getStoredThemePreference
  );

  const [
    householdName,
    setHouseholdName,
  ] = useState(
    household?.householdName ?? ""
  );

  const [
    country,
    setCountry,
  ] = useState(
    household?.country ?? ""
  );

  const [
    baseCurrency,
    setBaseCurrency,
  ] = useState(
    household?.currency ?? "PHP"
  );

  const [
    timezone,
    setTimezone,
  ] = useState(
    household?.timezone ?? ""
  );

  const [
    preferencesMessage,
    setPreferencesMessage,
  ] = useState("");

  const [
    preferencesError,
    setPreferencesError,
  ] = useState("");

  const [
    isConfirmingReset,
    setIsConfirmingReset,
  ] = useState(false);

  const [
    isResetting,
    setIsResetting,
  ] = useState(false);

  const [
    resetError,
    setResetError,
  ] = useState("");

  const [
    isConfirmingTestDataReset,
    setIsConfirmingTestDataReset,
  ] = useState(false);

  const [
    isClearingTestData,
    setIsClearingTestData,
  ] = useState(false);

  const [
    testDataResetError,
    setTestDataResetError,
  ] = useState("");

  const [
    backupMessage,
    setBackupMessage,
  ] = useState("");

  const [
    backupError,
    setBackupError,
  ] = useState("");

  const [
    restoreFilename,
    setRestoreFilename,
  ] = useState("");

  const [
    restoreJson,
    setRestoreJson,
  ] = useState("");

  const [
    restoreSummary,
    setRestoreSummary,
  ] = useState<
    ApplicationBackupSummary | undefined
  >();

  const [
    isConfirmingRestore,
    setIsConfirmingRestore,
  ] = useState(false);

  const [
    isRestoringBackup,
    setIsRestoringBackup,
  ] = useState(false);

  const countryOptions =
    countries.filter(
      (countryOption) =>
        countryOption.value
    );

  const currencyOptions =
    currencies.filter(
      (currencyOption) =>
        currencyOption.value
    );

  const timezoneOptions =
    timezones.filter(
      (timezoneOption) =>
        timezoneOption.value
    );

  const isKnownCountry =
    countryOptions.some(
      (countryOption) =>
        countryOption.value ===
        country
    );

  const isKnownCurrency =
    currencyOptions.some(
      (currencyOption) =>
        currencyOption.value ===
        baseCurrency
    );

  const isKnownTimezone =
    timezoneOptions.some(
      (timezoneOption) =>
        timezoneOption.value ===
        timezone
    );

  const transactionCount =
    household
      ? TransactionService
          .getTransactions()
          .filter(
            (transaction) =>
              transaction.householdId ===
              household.id
          ).length
      : 0;

  const hasSavedTransactions =
    transactionCount > 0;

  const hasPreferenceChanges =
    Boolean(household) &&
    (householdName !==
      (household?.householdName ??
        "") ||
      country !==
        (household?.country ?? "") ||
      baseCurrency !==
        (household?.currency ?? "") ||
      timezone !==
        (household?.timezone ?? ""));

  useEffect(() => {
    storeThemePreference(
      themePreference
    );
  }, [themePreference]);

  const handleBeginReset = (): void => {
    setResetError("");
    setIsConfirmingReset(true);
  };

  const handleCancelReset = (): void => {
    setResetError("");
    setIsConfirmingReset(false);
  };

  const handleConfirmReset = (): void => {
    setResetError("");
    setIsResetting(true);

    const result =
      resetApplicationData();

    if (!result.success) {
      setResetError(
        result.errors.join(" ")
      );

      setIsResetting(false);

      return;
    }

    reloadAfterApplicationReset();
  };

  const handleBeginTestDataReset = (): void => {
    setTestDataResetError("");
    setIsConfirmingTestDataReset(true);
  };

  const handleCancelTestDataReset = (): void => {
    setTestDataResetError("");
    setIsConfirmingTestDataReset(false);
  };

  const handleConfirmTestDataReset = (): void => {
    setTestDataResetError("");
    setIsClearingTestData(true);

    const result =
      resetHouseholdTestData();

    if (!result.success) {
      setTestDataResetError(
        result.errors.join(" ")
      );

      setIsClearingTestData(false);

      return;
    }

    reloadAfterApplicationReset();
  };

  const handleExportBackup = (): void => {
    setBackupMessage("");
    setBackupError("");

    const result =
      createApplicationBackup();

    if (
      !result.success ||
      !result.json ||
      !result.filename
    ) {
      setBackupError(
        result.message ??
          "Backup could not be exported."
      );

      return;
    }

    downloadBackupFile(
      result.filename,
      result.json
    );

    setBackupMessage(
      `Backup exported: ${result.filename}`
    );
  };

  const handleSelectBackupFile = async (
    file: File | undefined
  ): Promise<void> => {
    setBackupMessage("");
    setBackupError("");
    setRestoreFilename("");
    setRestoreJson("");
    setRestoreSummary(undefined);
    setIsConfirmingRestore(false);

    if (!file) {
      return;
    }

    let json: string;

    try {
      json =
        await file.text();
    } catch {
      setBackupError(
        "Backup file could not be read."
      );
      resetBackupFileInput();

      return;
    }

    const validation =
      validateApplicationBackup(
        json
      );

    if (!validation.success) {
      setBackupError(
        validation.message
      );
      resetBackupFileInput();

      return;
    }

    setRestoreFilename(
      file.name
    );
    setRestoreJson(json);
    setRestoreSummary(
      validation.summary
    );
    setIsConfirmingRestore(true);
  };

  const handleCancelRestore = (): void => {
    setBackupMessage("");
    setBackupError("");
    setRestoreFilename("");
    setRestoreJson("");
    setRestoreSummary(undefined);
    setIsConfirmingRestore(false);

    resetBackupFileInput();
  };

  const handleConfirmRestore = (): void => {
    setBackupMessage("");
    setBackupError("");
    setIsRestoringBackup(true);

    const result =
      restoreApplicationBackup(
        restoreJson
      );

    if (!result.success) {
      setBackupError(
        result.message
      );
      setIsRestoringBackup(false);

      return;
    }

    reloadAfterApplicationReset();
  };

  const resetBackupFileInput = (): void => {
    if (
      backupFileInputRef.current
    ) {
      backupFileInputRef
        .current
        .value = "";
    }
  };

  const clearPreferenceFeedback = (): void => {
    setPreferencesMessage("");
    setPreferencesError("");
  };

  const savePreferences = (): void => {
    clearPreferenceFeedback();

    const result =
      saveHouseholdPreferences({
        householdName:
          householdName,
        country:
          country,
        currency:
          baseCurrency,
        timezone:
          timezone,
      });

    if (!result) {
      setPreferencesError(
        "Unable to update household preferences."
      );

      return;
    }

    setPreferencesMessage(
      "Household preferences updated. Historical financial records were not changed."
    );

    navigate("/app");
  };

  const handleCountryPreferenceChange = (
    nextCountry: string
  ): void => {
    if (
      nextCountry ===
      customPreferenceValue
    ) {
      setCountry("");
      clearPreferenceFeedback();

      return;
    }

    const defaults =
      getCountryDefaults(
        nextCountry
    );

    setCountry(nextCountry);
    setBaseCurrency(
      defaults?.currency ??
        baseCurrency
    );
    setTimezone(
      defaults?.timezone ??
        timezone
    );
    clearPreferenceFeedback();
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Configure and manage your household application data"
      />

      <div className="space-y-6">
        <Card>
          <div className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">
                Household Preferences
              </h2>

              <p className="text-sm text-muted-foreground">
                Configure local display preferences for
                this browser.
              </p>
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="settings-theme"
                className="text-sm font-medium text-foreground"
              >
                Theme
              </label>

              <select
                id="settings-theme"
                value={themePreference}
                onChange={(event) =>
                  setThemePreference(
                    event.target
                      .value as ThemePreference
                  )
                }
                className="settings-preferences-select max-w-xs"
              >
                <option value="system">
                  System Default
                </option>

                <option value="light">
                  Light
                </option>

                <option value="dark">
                  Dark
                </option>
              </select>

              <p className="text-xs text-muted-foreground">
                Theme preference is stored locally in this
                browser.
              </p>
            </div>

            <div className="settings-preferences-grid">
              <div className="settings-preferences-field settings-preferences-field--wide">
                <label
                  htmlFor="settings-household-name"
                  className="text-sm font-medium text-foreground"
                >
                  Household Name
                </label>

                <input
                  id="settings-household-name"
                  type="text"
                  value={householdName}
                  onChange={(event) => {
                    setHouseholdName(
                      event.target.value
                    );
                    clearPreferenceFeedback();
                  }}
                  disabled={!household}
                  placeholder="Enter household name"
                  className="settings-preferences-input"
                />
              </div>

              <div className="settings-preferences-field">
                <label
                  htmlFor="settings-country"
                  className="text-sm font-medium text-foreground"
                >
                  Country
                </label>

                <select
                  id="settings-country"
                  value={
                    isKnownCountry
                      ? country
                      : customPreferenceValue
                  }
                  onChange={(event) =>
                    handleCountryPreferenceChange(
                      event.target.value
                    )
                  }
                  disabled={!household}
                  className="settings-preferences-select"
                >
                  {countryOptions.map(
                    (countryOption) => (
                      <option
                        key={
                          countryOption.value
                        }
                        value={
                          countryOption.value
                        }
                      >
                        {
                          countryOption.label
                        }
                      </option>
                    )
                  )}

                  <option
                    value={
                      customPreferenceValue
                    }
                  >
                    Other / manual
                  </option>
                </select>

                {!isKnownCountry && (
                  <input
                    type="text"
                    value={country}
                    onChange={(event) => {
                      setCountry(
                        event.target.value
                      );
                      clearPreferenceFeedback();
                    }}
                    disabled={!household}
                    placeholder="Enter country"
                    className="settings-preferences-input"
                  />
                )}
              </div>

              <div className="settings-preferences-field">
                <label
                  htmlFor="settings-base-currency"
                  className="text-sm font-medium text-foreground"
                >
                  Base Currency
                </label>

                <select
                  id="settings-base-currency"
                  value={
                    isKnownCurrency
                      ? baseCurrency
                      : customPreferenceValue
                  }
                  onChange={(event) => {
                    if (
                      event.target.value ===
                      customPreferenceValue
                    ) {
                      setBaseCurrency("");
                    } else {
                      setBaseCurrency(
                        event.target.value
                      );
                    }

                    clearPreferenceFeedback();
                  }}
                  disabled={!household}
                  className="settings-preferences-select"
                >
                  {currencyOptions.map(
                    (currency) => (
                      <option
                        key={currency.value}
                        value={currency.value}
                      >
                        {currency.label}
                      </option>
                    )
                  )}

                  <option
                    value={
                      customPreferenceValue
                    }
                  >
                    Other / manual
                  </option>
                </select>

                {!isKnownCurrency && (
                  <input
                    type="text"
                    value={baseCurrency}
                    onChange={(event) => {
                      setBaseCurrency(
                        event.target.value
                      );
                      clearPreferenceFeedback();
                    }}
                    disabled={!household}
                    placeholder="Enter currency code"
                    className="settings-preferences-input"
                    maxLength={8}
                  />
                )}

              </div>

              <div className="settings-preferences-field">
                <label
                  htmlFor="settings-timezone"
                  className="text-sm font-medium text-foreground"
                >
                  Time Zone
                </label>

                <select
                  id="settings-timezone"
                  value={
                    isKnownTimezone
                      ? timezone
                      : customPreferenceValue
                  }
                  onChange={(event) => {
                    if (
                      event.target.value ===
                      customPreferenceValue
                    ) {
                      setTimezone("");
                    } else {
                      setTimezone(
                        event.target.value
                      );
                    }

                    clearPreferenceFeedback();
                  }}
                  disabled={!household}
                  className="settings-preferences-select"
                >
                  {timezoneOptions.map(
                    (timezoneOption) => (
                      <option
                        key={
                          timezoneOption.value
                        }
                        value={
                          timezoneOption.value
                        }
                      >
                        {
                          timezoneOption.label
                        }
                      </option>
                    )
                  )}

                  <option
                    value={
                      customPreferenceValue
                    }
                  >
                    Other / manual
                  </option>
                </select>

                {!isKnownTimezone && (
                  <input
                    type="text"
                    value={timezone}
                    onChange={(event) => {
                      setTimezone(
                        event.target.value
                      );
                      clearPreferenceFeedback();
                    }}
                    disabled={!household}
                    placeholder="Enter IANA time zone"
                    className="settings-preferences-input"
                  />
                )}
              </div>

              {hasSavedTransactions && (
                <div className="settings-preferences-note">
                  <p>
                    <strong>
                      Historical records stay locked.
                    </strong>{" "}
                    This household already has{" "}
                    {transactionCount} transaction
                    {transactionCount === 1
                      ? ""
                      : "s"}
                    . Changing the base currency updates
                    future defaults only; existing
                    transactions keep their saved currency,
                    exchange rate, and converted amount.
                  </p>

                  <p>
                    These are the preferences chosen during
                    household setup. Base currency changes apply
                    going forward and do not convert or recompute
                    historical records. Some countries have
                    multiple regional time zones, so confirm the
                    time zone after selecting a country.
                  </p>

                  <p>
                    Future API conversion will store the rate
                    effective on the date a record is created
                    or used.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <div className="settings-preferences-actions">
                <Button
                  onClick={savePreferences}
                  disabled={
                    !hasPreferenceChanges
                  }
                >
                  Save Preferences
                </Button>

                {hasPreferenceChanges && (
                  <p className="settings-preferences-unsaved">
                    You have unsaved household preference changes.
                  </p>
                )}
              </div>

              {preferencesMessage && (
                <p className="text-sm font-medium text-success">
                  {preferencesMessage}
                </p>
              )}

              {preferencesError && (
                <p className="text-sm font-medium text-destructive">
                  {preferencesError}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Data & Backup
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Export a local HFOS backup file or restore from
                a validated backup file saved on this device.
              </p>
            </div>

            {(backupMessage || backupError) && (
              <div
                role={
                  backupError
                    ? "alert"
                    : "status"
                }
                className={[
                  "settings-alert",
                  backupError
                    ? "settings-alert--danger"
                    : "settings-alert--success",
                ].join(" ")}
              >
                {backupError ||
                  backupMessage}
              </div>
            )}

            <div className="settings-data-actions">
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={!household}
                className="settings-secondary-button"
              >
                Export Backup
              </button>

              <label className="settings-file-button">
                <span>
                  Import Backup
                </span>

                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json,.hfos-backup.json,application/json"
                  onChange={(event) => {
                    void handleSelectBackupFile(
                      event.target
                        .files?.[0]
                    );
                  }}
                  disabled={!household}
                />
              </label>
            </div>

            {isConfirmingRestore && (
              <div className="settings-confirmation settings-confirmation--success">
                <p className="settings-confirmation__title settings-confirmation__title--success">
                  Backup ready to restore
                </p>

                <p className="settings-confirmation__copy settings-confirmation__copy--success">
                  Restoring {restoreFilename} will replace
                  the current HFOS data in this browser.
                </p>

                {restoreSummary && (
                  <BackupSummaryList
                    summary={restoreSummary}
                  />
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    disabled={isRestoringBackup}
                    className="settings-confirm-button"
                  >
                    {isRestoringBackup
                      ? "Restoring..."
                      : "Restore Backup"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelRestore}
                    disabled={isRestoringBackup}
                    className="settings-secondary-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Clear Test Data
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Remove accounts, transactions, expense allocations,
                utility-bill records, settlements, savings records,
                and leftover HFOS preview keys while keeping this
                household setup, preferences, and theme.
              </p>
            </div>

            {testDataResetError && (
              <div
                role="alert"
                className="settings-alert settings-alert--danger"
              >
                {testDataResetError}
              </div>
            )}

            {!isConfirmingTestDataReset ? (
              <button
                type="button"
                onClick={handleBeginTestDataReset}
                disabled={!household}
                className="settings-secondary-button"
              >
                Clear Test Data
              </button>
            ) : (
              <div className="settings-confirmation settings-confirmation--neutral">
                <p className="settings-confirmation__title settings-confirmation__title--neutral">
                  Confirm test-data cleanup
                </p>

                <p className="settings-confirmation__copy settings-confirmation__copy--neutral">
                  Test financial records will be cleared from this
                  browser. Your household setup and preferences will
                  remain.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmTestDataReset}
                    disabled={isClearingTestData}
                    className="settings-secondary-button"
                  >
                    {isClearingTestData
                      ? "Clearing..."
                      : "Clear Test Data"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelTestDataReset}
                    disabled={isClearingTestData}
                    className="settings-secondary-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-destructive">
                Reset Application Data
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Permanently remove the household, members,
                accounts, transactions, expense allocations,
                utility bills, settlements, and settlement
                applications stored in this browser. Reset also
                clears leftover HFOS test-data keys from earlier
                preview builds.
              </p>

              <p className="mt-2 text-sm font-medium text-destructive">
                This action cannot be undone.
              </p>
            </div>

            {resetError && (
              <div
                role="alert"
                className="settings-alert settings-alert--danger"
              >
                {resetError}
              </div>
            )}

            {!isConfirmingReset ? (
              <button
                type="button"
                onClick={handleBeginReset}
                className="settings-danger-button"
              >
                Reset All Application Data
              </button>
            ) : (
              <div className="settings-confirmation">
                <p className="settings-confirmation__title">
                  Confirm permanent deletion
                </p>

                <p className="settings-confirmation__copy">
                  All locally stored HFOS data will be deleted
                  from this browser and the application will
                  return to household setup.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    disabled={isResetting}
                    className="settings-confirm-button"
                  >
                    {isResetting
                      ? "Resetting..."
                      : "Permanently Delete All Data"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelReset}
                    disabled={isResetting}
                    className="settings-secondary-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function BackupSummaryList({
  summary,
}: {
  summary: ApplicationBackupSummary;
}) {
  return (
    <dl className="settings-backup-summary">
      <div>
        <dt>Household</dt>
        <dd>{summary.householdName}</dd>
      </div>

      <div>
        <dt>Exported</dt>
        <dd>
          {formatBackupDate(
            summary.exportedAt
          )}
        </dd>
      </div>

      <div>
        <dt>Accounts</dt>
        <dd>{summary.accountCount}</dd>
      </div>

      <div>
        <dt>Transactions</dt>
        <dd>{summary.transactionCount}</dd>
      </div>

      <div>
        <dt>Settlements</dt>
        <dd>{summary.settlementCount}</dd>
      </div>

      <div>
        <dt>Savings Goals</dt>
        <dd>{summary.savingsGoalCount}</dd>
      </div>
    </dl>
  );
}

function formatBackupDate(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return date.toLocaleString();
}

function downloadBackupFile(
  filename: string,
  json: string
): void {
  const blob =
    new Blob([json], {
      type: "application/json",
    });

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;
  link.rel = "noopener";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
