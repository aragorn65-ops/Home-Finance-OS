import "./SettingsPage.css";

import {
  useEffect,
  useState,
} from "react";

import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";
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
                className="max-w-xs rounded-md border bg-background px-3 py-2 text-sm text-foreground"
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

            <div className="grid gap-5 border-t pt-4 md:grid-cols-3">
              <div className="grid gap-2">
                <label
                  htmlFor="settings-country"
                  className="text-sm font-medium text-foreground"
                >
                  Country
                </label>

                <select
                  id="settings-country"
                  value={country}
                  onChange={(event) =>
                    savePreferences({
                      country:
                        event.target.value,
                    })
                  }
                  disabled={!household}
                  className="rounded-md border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {countries
                    .filter(
                      (countryOption) =>
                        countryOption.value
                    )
                    .map(
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
                </select>
              </div>

              <div className="grid gap-2">
              <label
                htmlFor="settings-base-currency"
                className="text-sm font-medium text-foreground"
              >
                Base Currency
              </label>

              <select
                id="settings-base-currency"
                value={baseCurrency}
                onChange={(event) =>
                  savePreferences({
                    currency:
                      event.target.value,
                  })
                }
                disabled={!household}
                className="rounded-md border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {currencies
                  .filter(
                    (currency) =>
                      currency.value
                  )
                  .map((currency) => (
                    <option
                      key={currency.value}
                      value={currency.value}
                    >
                      {currency.label}
                    </option>
                  ))}
              </select>
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="settings-timezone"
                  className="text-sm font-medium text-foreground"
                >
                  Time Zone
                </label>

                <select
                  id="settings-timezone"
                  value={timezone}
                  onChange={(event) =>
                    savePreferences({
                      timezone:
                        event.target.value,
                    })
                  }
                  disabled={!household}
                  className="rounded-md border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {timezones
                    .filter(
                      (timezoneOption) =>
                        timezoneOption.value
                    )
                    .map(
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
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <p className="text-xs text-muted-foreground">
                These are the preferences chosen during
                household setup. Base currency changes apply
                going forward and do not convert or recompute
                historical records.
              </p>

              <p className="text-xs text-muted-foreground">
                Future API conversion will store the rate
                effective on the date a record is created
                or used.
              </p>

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
                applications stored in this browser.
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
                  and the application will return to household
                  setup.
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
