import "./SettingsPage.css";

import {
  useEffect,
  useState,
} from "react";

import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";
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
} from "../../startup/services/applicationDataReset";
import TransactionService from "../../transactions/services/TransactionService";

const customPreferenceValue =
  "__custom__";

export default function SettingsPage() {
  const household =
    loadHousehold();

  const [
    themePreference,
    setThemePreference,
  ] = useState<ThemePreference>(
    getStoredThemePreference
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

  const savePreferences = (
    nextPreferences: {
      country?: string;
      currency?: string;
      timezone?: string;
    }
  ): void => {
    const nextCountry =
      nextPreferences.country ??
      country;

    const nextCurrency =
      nextPreferences.currency ??
      baseCurrency;

    const nextTimezone =
      nextPreferences.timezone ??
      timezone;

    setCountry(nextCountry);
    setBaseCurrency(nextCurrency);
    setTimezone(nextTimezone);

    setPreferencesMessage("");
    setPreferencesError("");

    const result =
      saveHouseholdPreferences({
        country:
          nextCountry,
        currency:
          nextCurrency,
        timezone:
          nextTimezone,
      });

    if (!result) {
      setPreferencesError(
        "Unable to update household preferences."
      );

      return;
    }

    setPreferencesMessage(
      "Household preferences updated. Historical financial records were not recomputed."
    );
  };

  const handleCountryPreferenceChange = (
    nextCountry: string
  ): void => {
    if (
      nextCountry ===
      customPreferenceValue
    ) {
      setCountry("");
      setPreferencesMessage("");
      setPreferencesError("");

      return;
    }

    const defaults =
      getCountryDefaults(
        nextCountry
      );

    savePreferences({
      country:
        nextCountry,
      currency:
        defaults?.currency ??
        baseCurrency,
      timezone:
        defaults?.timezone ??
        timezone,
    });
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
                    onChange={(event) =>
                      savePreferences({
                        country:
                          event.target.value,
                      })
                    }
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
                  onChange={(event) =>
                    event.target.value ===
                    customPreferenceValue
                      ? setBaseCurrency("")
                      : savePreferences({
                          currency:
                            event.target.value,
                        })
                  }
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
                    onChange={(event) =>
                      savePreferences({
                        currency:
                          event.target.value,
                      })
                    }
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
                  onChange={(event) =>
                    event.target.value ===
                    customPreferenceValue
                      ? setTimezone("")
                      : savePreferences({
                          timezone:
                            event.target.value,
                        })
                  }
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
                    onChange={(event) =>
                      savePreferences({
                        timezone:
                          event.target.value,
                      })
                    }
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
