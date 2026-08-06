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
  AuthDiagnosticsPanel,
  getAuthBackendAdapter,
  useHouseholdMembership,
} from "../../auth";
import {
  isAuthFeatureEnabled,
} from "../../../config/auth";

import {
  reloadAfterApplicationReset,
  resetApplicationData,
  resetHouseholdTestData,
} from "../../startup/services/applicationDataReset";
import {
  createApplicationBackup,
  getApplicationDataHealthSummary,
  restoreApplicationBackup,
  validateApplicationBackup,
  type ApplicationDataHealthSummary,
  type ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";
import {
  downloadGoogleDriveBackup,
  isGoogleDriveBackupConfigured,
  listGoogleDriveBackups,
  saveBackupToGoogleDrive,
  type GoogleDriveBackupFile,
} from "../../startup/services/googleDriveBackup";
import TransactionService from "../../transactions/services/TransactionService";
import {
  disableAppLock,
  enableAppLock,
  getAppLockIdleTimeoutMinutes,
  isAppLockEnabled,
  updateAppLockIdleTimeout,
} from "../../security/services/appLockService";
import {
  createGoogleDriveBackupStatus,
} from "../services/googleDriveBackupStatus";

const customPreferenceValue =
  "__custom__";

const appLockIdleTimeoutOptions = [
  {
    value: 0,
    label: "Off",
  },
  {
    value: 1,
    label: "1 minute",
  },
  {
    value: 5,
    label: "5 minutes",
  },
  {
    value: 15,
    label: "15 minutes",
  },
  {
    value: 30,
    label: "30 minutes",
  },
];

export default function SettingsPage() {
  const navigate =
    useNavigate();

  const household =
    loadHousehold();
  const authHouseholdId =
    household?.authenticatedLink
      ?.remoteHouseholdId ??
    household?.id ??
    "";
  const {
    session,
    membership,
  } = useHouseholdMembership(
    authHouseholdId
  );
  const isProductionAuthEnabled =
    isAuthFeatureEnabled();
  const canManageHouseholdSettings =
    !isProductionAuthEnabled ||
    (
      session.status === "signed-in" &&
      (
        membership?.role === "owner" ||
        membership?.role === "admin"
      )
    );
  const canViewAuthDiagnostics =
    isProductionAuthEnabled ||
    canManageHouseholdSettings;

  const backupFileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const restoreConfirmationRef =
    useRef<HTMLDivElement | null>(
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
    isSavingPreferences,
    setIsSavingPreferences,
  ] = useState(false);

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
    isBackupPasswordProtectionEnabled,
    setIsBackupPasswordProtectionEnabled,
  ] = useState(false);

  const [
    backupPassword,
    setBackupPassword,
  ] = useState("");

  const [
    backupPasswordConfirmation,
    setBackupPasswordConfirmation,
  ] = useState("");

  const [
    isSavingCloudBackup,
    setIsSavingCloudBackup,
  ] = useState(false);

  const [
    driveBackups,
    setDriveBackups,
  ] = useState<GoogleDriveBackupFile[]>([]);

  const [
    isLoadingDriveBackups,
    setIsLoadingDriveBackups,
  ] = useState(false);

  const [
    hasLoadedDriveBackups,
    setHasLoadedDriveBackups,
  ] = useState(false);

  const [
    isDownloadingDriveBackup,
    setIsDownloadingDriveBackup,
  ] = useState(false);

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
    restorePassword,
    setRestorePassword,
  ] = useState("");

  const [
    restoreNeedsPassword,
    setRestoreNeedsPassword,
  ] = useState(false);

  const [
    isConfirmingRestore,
    setIsConfirmingRestore,
  ] = useState(false);

  const [
    isRestoringBackup,
    setIsRestoringBackup,
  ] = useState(false);

  const [
    isAppLockCurrentlyEnabled,
    setIsAppLockCurrentlyEnabled,
  ] = useState(() =>
    isAppLockEnabled()
  );

  const [
    appLockPin,
    setAppLockPin,
  ] = useState("");

  const [
    appLockPinConfirmation,
    setAppLockPinConfirmation,
  ] = useState("");

  const [
    appLockDisablePin,
    setAppLockDisablePin,
  ] = useState("");

  const [
    appLockIdleTimeoutMinutes,
    setAppLockIdleTimeoutMinutes,
  ] = useState(() =>
    getAppLockIdleTimeoutMinutes()
  );

  const [
    appLockMessage,
    setAppLockMessage,
  ] = useState("");

  const [
    appLockError,
    setAppLockError,
  ] = useState("");

  const [
    isSavingAppLock,
    setIsSavingAppLock,
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

  const dataHealthSummary =
    getApplicationDataHealthSummary();

  const isGoogleDriveConfigured =
    isGoogleDriveBackupConfigured();

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

  const isAppLockPinReady =
    /^\d{4,8}$/.test(appLockPin) &&
    appLockPin ===
      appLockPinConfirmation;

  const isBackupPasswordReady =
    !isBackupPasswordProtectionEnabled ||
    (backupPassword.length >= 8 &&
      backupPassword ===
        backupPasswordConfirmation);

  const googleDriveBackupStatus =
    createGoogleDriveBackupStatus({
      isConfigured:
        isGoogleDriveConfigured,
      isDataExportable:
        dataHealthSummary
          .isExportable,
      isBackupPasswordReady,
      isSavingCloudBackup,
      isLoadingDriveBackups,
      isDownloadingDriveBackup,
    });

  useEffect(() => {
    storeThemePreference(
      themePreference
    );
  }, [themePreference]);

  useEffect(() => {
    if (!isConfirmingRestore) {
      return;
    }

    restoreConfirmationRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [isConfirmingRestore]);

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

  const handleExportBackup =
    async (): Promise<void> => {
    setBackupMessage("");
    setBackupError("");

    const backupOptions =
      getBackupCreationOptions();

    if (!backupOptions.success) {
      setBackupError(
        backupOptions.message
      );

      return;
    }

    const result =
      await createApplicationBackup(
        backupOptions.options
      );

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

  const handleSaveBackupToGoogleDrive =
    async (): Promise<void> => {
      setBackupMessage("");
      setBackupError("");

      const backupOptions =
        getBackupCreationOptions();

      if (!backupOptions.success) {
        setBackupError(
          backupOptions.message
        );

        return;
      }

      setIsSavingCloudBackup(true);

      try {
        const backup =
          await createApplicationBackup(
            backupOptions.options
          );

        if (
          !backup.success ||
          !backup.json ||
          !backup.filename
        ) {
          setBackupError(
            backup.message ??
              "Backup could not be prepared for Google Drive."
          );

          return;
        }

        const result =
          await saveBackupToGoogleDrive({
            filename:
              backup.filename,
            json:
              backup.json,
          });

        if (!result.success) {
          setBackupError(
            result.message
          );

          return;
        }

        setBackupMessage(
          result.message
        );
      } catch {
        setBackupError(
          "Google Drive backup could not be completed."
        );
      } finally {
        setIsSavingCloudBackup(false);
      }
    };

  const handleLoadDriveBackups =
    async (): Promise<void> => {
      setBackupMessage("");
      setBackupError("");
      setDriveBackups([]);
      setHasLoadedDriveBackups(false);
      setIsLoadingDriveBackups(true);

      try {
        const result =
          await listGoogleDriveBackups();

        if (!result.success) {
          setBackupError(
            result.message
          );

          return;
        }

        setDriveBackups(
          result.files
        );
        setHasLoadedDriveBackups(true);
        setBackupMessage(
          result.message
        );
      } catch {
        setHasLoadedDriveBackups(false);
        setBackupError(
          "Google Drive backups could not be loaded."
        );
      } finally {
        setIsLoadingDriveBackups(false);
      }
    };

  const handleSelectDriveBackup =
    async (
      file: GoogleDriveBackupFile
    ): Promise<void> => {
      setBackupMessage("");
      setBackupError("");
      setRestoreFilename("");
      setRestoreJson("");
      setRestoreSummary(undefined);
      setRestorePassword("");
      setRestoreNeedsPassword(false);
      setIsConfirmingRestore(false);
      setIsDownloadingDriveBackup(true);

      try {
        const download =
          await downloadGoogleDriveBackup(
            file
          );

        if (!download.success) {
          setBackupError(
            download.message
          );

          return;
        }

        await prepareBackupForRestore(
          download.filename,
          download.json
        );
      } catch {
        setBackupError(
          "Google Drive backup could not be prepared for restore."
        );
      } finally {
        setIsDownloadingDriveBackup(false);
      }
    };

  const handleSelectBackupFile = async (
    file: File | undefined
  ): Promise<void> => {
    setBackupMessage("");
    setBackupError("");
    setRestoreFilename("");
    setRestoreJson("");
    setRestoreSummary(undefined);
    setRestorePassword("");
    setRestoreNeedsPassword(false);
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

    await prepareBackupForRestore(
      file.name,
      json
    );
  };

  const prepareBackupForRestore =
    async (
      filename: string,
      json: string
    ): Promise<void> => {
      const validation =
        await validateApplicationBackup(
          json
        );

    if (!validation.success) {
      if (
        validation.requiresPassword
      ) {
        setRestoreFilename(
          filename
        );
        setRestoreJson(json);
        setRestoreSummary(undefined);
        setRestorePassword("");
        setRestoreNeedsPassword(true);
        setIsConfirmingRestore(true);

        return;
      }

      setBackupError(
        validation.message
      );
      resetBackupFileInput();

      return;
    }

    setRestoreFilename(
      filename
    );
    setRestoreJson(json);
    setRestoreSummary(
      validation.summary
    );
    setRestorePassword("");
    setRestoreNeedsPassword(false);
    setIsConfirmingRestore(true);
  };

  const handleUnlockRestoreBackup =
    async (): Promise<void> => {
      setBackupMessage("");
      setBackupError("");

      const validation =
        await validateApplicationBackup(
          restoreJson,
          restorePassword
        );

      if (!validation.success) {
        setBackupError(
          validation.message
        );

        return;
      }

      setRestoreSummary(
        validation.summary
      );
      setRestoreNeedsPassword(false);
      setBackupMessage(
        "Password accepted. Review the backup summary before restoring."
      );
    };

  const handleCancelRestore = (): void => {
    setBackupMessage("");
    setBackupError("");
    setRestoreFilename("");
    setRestoreJson("");
    setRestoreSummary(undefined);
    setRestorePassword("");
    setRestoreNeedsPassword(false);
    setIsConfirmingRestore(false);

    resetBackupFileInput();
  };

  const handleConfirmRestore =
    async (): Promise<void> => {
    setBackupMessage("");
    setBackupError("");
    setIsRestoringBackup(true);

    const result =
      await restoreApplicationBackup(
        restoreJson,
        restorePassword
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

  const getBackupCreationOptions = ():
    | {
        success: true;
        options: {
          password?: string;
        };
      }
    | {
        success: false;
        message: string;
      } => {
    if (
      !isBackupPasswordProtectionEnabled
    ) {
      return {
        success: true,
        options: {},
      };
    }

    if (backupPassword.length < 8) {
      return {
        success: false,
        message:
          "Use a backup password with at least 8 characters.",
      };
    }

    if (
      backupPassword !==
      backupPasswordConfirmation
    ) {
      return {
        success: false,
        message:
          "Backup password entries do not match.",
      };
    }

    return {
      success: true,
      options: {
        password:
          backupPassword,
      },
    };
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

  const savePreferences =
    async (): Promise<void> => {
    clearPreferenceFeedback();

    if (!household) {
      setPreferencesError(
        "Unable to update household preferences."
      );

      return;
    }

    setIsSavingPreferences(true);

    try {
      if (
        isAuthFeatureEnabled() &&
        household.authenticatedLink
      ) {
        await getAuthBackendAdapter()
          .saveRemoteHouseholdPreferences({
            householdId:
              household
                .authenticatedLink
                .remoteHouseholdId,
            name:
              householdName,
            country:
              country,
            currency:
              baseCurrency,
            timezone:
              timezone,
          });
      }
    } catch (error) {
      setPreferencesError(
        `Cloud household preferences were not saved: ${getErrorMessage(error)}`
      );
      setIsSavingPreferences(false);

      return;
    }

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
      setIsSavingPreferences(false);

      return;
    }

    setIsSavingPreferences(false);

    setPreferencesMessage(
      "Household preferences updated. Historical financial records were not changed."
    );

    navigate("/app");
  };

  const handleEnableAppLock =
    async (): Promise<void> => {
      setAppLockMessage("");
      setAppLockError("");

      if (
        appLockPin !==
        appLockPinConfirmation
      ) {
        setAppLockError(
          "PIN entries do not match."
        );

        return;
      }

      setIsSavingAppLock(true);

      const result =
        await enableAppLock(
          appLockPin,
          appLockIdleTimeoutMinutes
        );

      setIsSavingAppLock(false);

      if (!result.success) {
        setAppLockError(
          result.message
        );

        return;
      }

      setIsAppLockCurrentlyEnabled(
        true
      );
      setAppLockPin("");
      setAppLockPinConfirmation("");
      setAppLockMessage(
        result.message
      );
      notifyAppLockSettingsChanged();
    };

  const handleUpdateAppLockIdleTimeout =
    (nextValue: number): void => {
      setAppLockMessage("");
      setAppLockError("");
      setAppLockIdleTimeoutMinutes(
        nextValue
      );

      if (!isAppLockCurrentlyEnabled) {
        return;
      }

      const result =
        updateAppLockIdleTimeout(
          nextValue
        );

      if (!result.success) {
        setAppLockError(
          result.message
        );

        return;
      }

      setAppLockMessage(
        nextValue > 0
          ? `HFOS will lock after ${formatIdleTimeoutLabel(nextValue)} of inactivity.`
          : "Inactivity lock is off."
      );
      notifyAppLockSettingsChanged();
    };

  const handleDisableAppLock =
    async (): Promise<void> => {
      setAppLockMessage("");
      setAppLockError("");
      setIsSavingAppLock(true);

      const result =
        await disableAppLock(
          appLockDisablePin
        );

      setIsSavingAppLock(false);

      if (!result.success) {
        setAppLockError(
          result.message
        );

        return;
      }

      setIsAppLockCurrentlyEnabled(
        false
      );
      setAppLockDisablePin("");
      setAppLockMessage(
        result.message
      );
      notifyAppLockSettingsChanged();
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
        subtitle={
          !canManageHouseholdSettings
            ? "Manage local display and app lock settings"
            : "Configure and manage your household application data"
        }
      />

      <div className="space-y-6">
        <Card>
          <div className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">
                {canManageHouseholdSettings
                  ? "Household Preferences"
                  : "Display Preferences"}
              </h2>

              <p className="text-sm text-muted-foreground">
                {canManageHouseholdSettings
                  ? "Set household defaults and local display preferences."
                  : "Configure local display preferences for this browser."}
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

            {canManageHouseholdSettings && (
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
            )}

            {canManageHouseholdSettings && (
            <div className="grid gap-2">
              <div className="settings-preferences-actions">
                <Button
                  onClick={savePreferences}
                  disabled={
                    !hasPreferenceChanges ||
                    isSavingPreferences
                  }
                >
                  {isSavingPreferences
                    ? "Saving..."
                    : "Save Preferences"}
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
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                App Lock
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Add a local PIN before household data is shown in
                this browser. This protects casual access on this
                device; it is not a cloud login.
              </p>
            </div>

            {(appLockMessage ||
              appLockError) && (
              <div
                role={
                  appLockError
                    ? "alert"
                    : "status"
                }
                className={[
                  "settings-alert",
                  appLockError
                    ? "settings-alert--danger"
                    : "settings-alert--success",
                ].join(" ")}
              >
                {appLockError ||
                  appLockMessage}
              </div>
            )}

            <div className="settings-app-lock-status">
              <span>
                Status
              </span>

              <strong>
                {isAppLockCurrentlyEnabled
                  ? "Enabled"
                  : "Off"}
              </strong>
            </div>

            {!isAppLockCurrentlyEnabled ? (
              <div className="settings-app-lock-grid">
                <label className="settings-preferences-field">
                  <span className="text-sm font-medium text-foreground">
                    New PIN
                  </span>

                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="new-password"
                    value={appLockPin}
                    onChange={(event) => {
                      setAppLockPin(
                        normalizePinInput(
                          event.target.value
                        )
                      );
                      setAppLockError("");
                      setAppLockMessage("");
                    }}
                    className="settings-preferences-input"
                    placeholder="4 to 8 digits"
                    maxLength={8}
                  />
                </label>

                <label className="settings-preferences-field">
                  <span className="text-sm font-medium text-foreground">
                    Confirm PIN
                  </span>

                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="new-password"
                    value={
                      appLockPinConfirmation
                    }
                    onChange={(event) => {
                      setAppLockPinConfirmation(
                        normalizePinInput(
                          event.target.value
                        )
                      );
                      setAppLockError("");
                      setAppLockMessage("");
                    }}
                    className="settings-preferences-input"
                    placeholder="Repeat PIN"
                    maxLength={8}
                  />
                </label>

                <label className="settings-preferences-field">
                  <span className="text-sm font-medium text-foreground">
                    Lock After Inactivity
                  </span>

                  <select
                    value={
                      appLockIdleTimeoutMinutes
                    }
                    onChange={(event) =>
                      handleUpdateAppLockIdleTimeout(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="settings-preferences-select"
                  >
                    {appLockIdleTimeoutOptions.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <div className="settings-app-lock-actions">
                  <button
                    type="button"
                    onClick={() => {
                      void handleEnableAppLock();
                    }}
                    disabled={
                      isSavingAppLock ||
                      !isAppLockPinReady
                    }
                    className="settings-secondary-button"
                  >
                    {isSavingAppLock
                      ? "Saving..."
                      : "Enable App Lock"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="settings-app-lock-grid">
                <label className="settings-preferences-field">
                  <span className="text-sm font-medium text-foreground">
                    Lock After Inactivity
                  </span>

                  <select
                    value={
                      appLockIdleTimeoutMinutes
                    }
                    onChange={(event) =>
                      handleUpdateAppLockIdleTimeout(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="settings-preferences-select"
                  >
                    {appLockIdleTimeoutOptions.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="settings-preferences-field">
                  <span className="text-sm font-medium text-foreground">
                    Current PIN
                  </span>

                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="current-password"
                    value={appLockDisablePin}
                    onChange={(event) => {
                      setAppLockDisablePin(
                        normalizePinInput(
                          event.target.value
                        )
                      );
                      setAppLockError("");
                      setAppLockMessage("");
                    }}
                    className="settings-preferences-input"
                    placeholder="Enter PIN to disable"
                    maxLength={8}
                  />
                </label>

                <div className="settings-app-lock-actions">
                  <button
                    type="button"
                    onClick={() => {
                      void handleDisableAppLock();
                    }}
                    disabled={
                      isSavingAppLock ||
                      appLockDisablePin.length ===
                        0
                    }
                    className="settings-secondary-button"
                  >
                    {isSavingAppLock
                      ? "Checking..."
                      : "Disable App Lock"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {canViewAuthDiagnostics && (
        <Card>
          <AuthDiagnosticsPanel />
        </Card>
        )}

        {canManageHouseholdSettings && (
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

            <div className="settings-backup-protection">
              <label className="settings-checkbox-row">
                <input
                  type="checkbox"
                  checked={
                    isBackupPasswordProtectionEnabled
                  }
                  onChange={(event) => {
                    setIsBackupPasswordProtectionEnabled(
                      event.target.checked
                    );

                    if (
                      !event.target.checked
                    ) {
                      setBackupPassword("");
                      setBackupPasswordConfirmation(
                        ""
                      );
                    }
                  }}
                />

                <span>
                  Password-protect new backup exports
                </span>
              </label>

              {isBackupPasswordProtectionEnabled && (
                <div className="settings-backup-protection__grid">
                  <div className="settings-preferences-field">
                    <label
                      htmlFor="settings-backup-password"
                      className="text-sm font-medium text-foreground"
                    >
                      Backup Password
                    </label>

                    <input
                      id="settings-backup-password"
                      type="password"
                      value={backupPassword}
                      onChange={(event) =>
                        setBackupPassword(
                          event.target.value
                        )
                      }
                      className="settings-preferences-input"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="settings-preferences-field">
                    <label
                      htmlFor="settings-backup-password-confirmation"
                      className="text-sm font-medium text-foreground"
                    >
                      Confirm Password
                    </label>

                    <input
                      id="settings-backup-password-confirmation"
                      type="password"
                      value={
                        backupPasswordConfirmation
                      }
                      onChange={(event) =>
                        setBackupPasswordConfirmation(
                          event.target.value
                        )
                      }
                      className="settings-preferences-input"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              <p>
                Password protection applies only to new backup
                files. Existing HFOS backups remain restorable
                without a password unless they were exported with
                protection enabled.
              </p>
            </div>

            <div className="settings-backup-safety-note">
              <strong>
                Public beta safety
              </strong>

              <p>
                Use sample or low-risk data only. Sign in as the household
                admin for cloud-backed workflows, keep local backups during
                public beta, and export a backup before and after meaningful
                testing.
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
                onClick={() => {
                  void handleExportBackup();
                }}
                disabled={
                  !dataHealthSummary
                    .isExportable ||
                  !isBackupPasswordReady
                }
                className="settings-secondary-button"
              >
                Export Backup
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleSaveBackupToGoogleDrive();
                }}
                disabled={
                  googleDriveBackupStatus
                    .isSaveDisabled
                }
                className="settings-secondary-button"
              >
                {isSavingCloudBackup
                  ? "Saving to Drive..."
                  : "Save to Google Drive"}
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleLoadDriveBackups();
                }}
                disabled={
                  googleDriveBackupStatus
                    .isRestoreDisabled
                }
                className="settings-secondary-button"
              >
                {isLoadingDriveBackups
                  ? "Loading Drive..."
                  : "Restore from Google Drive"}
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
              <div
                ref={restoreConfirmationRef}
                className="settings-confirmation settings-confirmation--success"
              >
                <p className="settings-confirmation__title settings-confirmation__title--success">
                  Backup ready to restore
                </p>

                <p className="settings-confirmation__copy settings-confirmation__copy--success">
                  {restoreNeedsPassword
                    ? `Enter the backup password for ${restoreFilename} to preview it before restore.`
                    : `Review the backup summary, then press Restore Backup to replace the current HFOS data in this browser with ${restoreFilename}.`}
                </p>

                {restoreNeedsPassword && (
                  <div className="settings-restore-password">
                    <label
                      htmlFor="settings-restore-password"
                      className="text-sm font-medium text-foreground"
                    >
                      Backup Password
                    </label>

                    <input
                      id="settings-restore-password"
                      type="password"
                      value={restorePassword}
                      onChange={(event) =>
                        setRestorePassword(
                          event.target.value
                        )
                      }
                      className="settings-preferences-input"
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        void handleUnlockRestoreBackup();
                      }}
                      disabled={
                        restorePassword.length ===
                        0
                      }
                      className="settings-secondary-button"
                    >
                      Unlock Backup
                    </button>
                  </div>
                )}

                {restoreSummary && (
                  <BackupSummaryList
                    summary={restoreSummary}
                  />
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void handleConfirmRestore();
                    }}
                    disabled={
                      isRestoringBackup ||
                      restoreNeedsPassword
                    }
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

            <div className="settings-cloud-note">
              {
                googleDriveBackupStatus
                  .message
              }
            </div>

            {driveBackups.length > 0 && (
              <div className="settings-drive-backups">
                <div>
                  <h3>
                    Google Drive Backups
                  </h3>

                  <p>
                    Choose a backup saved by this app to download,
                    validate, and preview before restore. For a
                    manually uploaded Drive file, download it first and
                    use Import Backup.
                  </p>
                </div>

                <div className="settings-drive-backups__list">
                  {driveBackups.map(
                    (file) => (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => {
                          void handleSelectDriveBackup(
                            file
                          );
                        }}
                        disabled={
                          isDownloadingDriveBackup
                        }
                        className="settings-drive-backup"
                      >
                        <span>
                          {file.name}
                        </span>

                        <small>
                          {formatDriveBackupMeta(
                            file
                          )}
                        </small>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {isGoogleDriveConfigured &&
              hasLoadedDriveBackups &&
              !isLoadingDriveBackups &&
              driveBackups.length === 0 &&
              !backupError && (
                <div className="settings-drive-backups settings-drive-backups--empty">
                  <div>
                    <h3>
                      No Google Drive backups found
                    </h3>

                    <p>
                      Use Save to Google Drive first, then return here
                      to restore a backup saved by this app. Manually
                      uploaded Drive files are not visible to this
                      low-permission restore list; download them and use
                      Import Backup instead.
                    </p>
                  </div>
                </div>
              )}

            <div className="settings-data-health">
              <div>
                <h3>
                  Current Browser Data
                </h3>

                <p>
                  {
                    dataHealthSummary
                      .message
                  }
                </p>
              </div>

              <DataHealthSummaryList
                summary={
                  dataHealthSummary
                }
              />
            </div>
          </div>
        </Card>
        )}

        {canManageHouseholdSettings && (
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
                household setup, authenticated link state,
                preferences, and theme.
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
                  browser. Your household setup, authenticated link
                  state, and preferences will remain.
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
        )}

        {canManageHouseholdSettings && (
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
                clears authenticated link state and leftover HFOS
                test-data keys from earlier preview builds.
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
                  from this browser, including any authenticated
                  household link, and the application will return
                  to household setup.
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
        )}
      </div>
    </>
  );
}

function DataHealthSummaryList({
  summary,
}: {
  summary: ApplicationDataHealthSummary;
}) {
  return (
    <dl className="settings-backup-summary">
      <div>
        <dt>Household</dt>
        <dd>{summary.householdName}</dd>
      </div>

      <div>
        <dt>Schema</dt>
        <dd>
          v{summary.storageSchemaVersion}
        </dd>
      </div>

      <div>
        <dt>Link</dt>
        <dd>
          {formatAuthenticatedLinkStatus(
            summary.authenticatedLinkStatus
          )}
        </dd>
      </div>

      {summary.remoteHouseholdId && (
        <div>
          <dt>Remote Household</dt>
          <dd>{summary.remoteHouseholdId}</dd>
        </div>
      )}

      <div>
        <dt>Theme</dt>
        <dd>
          {formatThemePreference(
            summary.themePreference
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
        <dt>Allocations</dt>
        <dd>
          {summary.expenseAllocationCount}
        </dd>
      </div>

      <div>
        <dt>Settlements</dt>
        <dd>{summary.settlementCount}</dd>
      </div>

      <div>
        <dt>Applications</dt>
        <dd>
          {
            summary
              .settlementApplicationCount
          }
        </dd>
      </div>

      <div>
        <dt>Savings Goals</dt>
        <dd>{summary.savingsGoalCount}</dd>
      </div>

      <div>
        <dt>Savings Activity</dt>
        <dd>
          {summary.savingsActivityCount}
        </dd>
      </div>
    </dl>
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

      {summary.storageSchemaVersion !==
        undefined && (
        <div>
          <dt>Schema</dt>
          <dd>
            v{summary.storageSchemaVersion}
          </dd>
        </div>
      )}

      {summary.authenticatedLinkStatus && (
        <div>
          <dt>Link</dt>
          <dd>
            {formatAuthenticatedLinkStatus(
              summary.authenticatedLinkStatus
            )}
          </dd>
        </div>
      )}

      {summary.remoteHouseholdId && (
        <div>
          <dt>Remote Household</dt>
          <dd>{summary.remoteHouseholdId}</dd>
        </div>
      )}

      {summary.backupVersion !==
        undefined && (
        <div>
          <dt>Backup</dt>
          <dd>
            v{summary.backupVersion}
          </dd>
        </div>
      )}

      {summary.themePreference && (
        <div>
          <dt>Theme</dt>
          <dd>
            {formatThemePreference(
              summary.themePreference
            )}
          </dd>
        </div>
      )}

      {summary.passwordProtected && (
        <div>
          <dt>Protection</dt>
          <dd>Password protected</dd>
        </div>
      )}

      <div>
        <dt>Accounts</dt>
        <dd>{summary.accountCount}</dd>
      </div>

      <div>
        <dt>Transactions</dt>
        <dd>{summary.transactionCount}</dd>
      </div>

      {summary.expenseAllocationCount !==
        undefined && (
        <div>
          <dt>Allocations</dt>
          <dd>
            {
              summary
                .expenseAllocationCount
            }
          </dd>
        </div>
      )}

      <div>
        <dt>Settlements</dt>
        <dd>{summary.settlementCount}</dd>
      </div>

      {summary.settlementApplicationCount !==
        undefined && (
        <div>
          <dt>Applications</dt>
          <dd>
            {
              summary
                .settlementApplicationCount
            }
          </dd>
        </div>
      )}

      <div>
        <dt>Savings Goals</dt>
        <dd>{summary.savingsGoalCount}</dd>
      </div>

      {summary.savingsActivityCount !==
        undefined && (
        <div>
          <dt>Savings Activity</dt>
          <dd>
            {
              summary
                .savingsActivityCount
            }
          </dd>
        </div>
      )}
    </dl>
  );
}

function formatThemePreference(
  value: string
): string {
  return value
    .replace(/^\w/, (letter) =>
      letter.toUpperCase()
    );
}

function formatAuthenticatedLinkStatus(
  value: "linked" | "unlinked"
): string {
  return value === "linked"
    ? "Linked"
    : "Local only";
}

function formatDriveBackupMeta(
  file: GoogleDriveBackupFile
): string {
  const dateValue =
    file.createdTime ??
    file.modifiedTime;

  const parts = [
    dateValue
      ? formatBackupDate(
          dateValue
        )
      : "Date unavailable",
    file.size
      ? formatFileSize(
          Number(file.size)
        )
      : "Size unavailable",
  ];

  return parts.join(" | ");
}

function formatFileSize(
  bytes: number
): string {
  if (
    !Number.isFinite(bytes) ||
    bytes < 0
  ) {
    return "Size unavailable";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatIdleTimeoutLabel(
  minutes: number
): string {
  return minutes === 1
    ? "1 minute"
    : `${minutes} minutes`;
}

function normalizePinInput(
  value: string
): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 8);
}

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Unknown error";
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

function notifyAppLockSettingsChanged():
  void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new Event(
      "hfos-app-lock-settings-changed"
    )
  );
}
