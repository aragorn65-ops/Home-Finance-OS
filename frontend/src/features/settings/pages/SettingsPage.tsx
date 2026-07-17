import "./SettingsPage.css";

import {
  useEffect,
  useState,
} from "react";

import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";
import { currencies } from "../../../shared/data/currencies";
import {
  getStoredThemePreference,
  storeThemePreference,
  type ThemePreference,
} from "../../../shared/theme/themePreference";
import {
  loadHousehold,
  saveHouseholdCurrency,
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
    baseCurrency,
    setBaseCurrency,
  ] = useState(
    household?.currency ?? "PHP"
  );

  const [
    currencyMessage,
    setCurrencyMessage,
  ] = useState("");

  const [
    currencyError,
    setCurrencyError,
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

  const handleBaseCurrencyChange = (
    nextCurrency: string
  ): void => {
    setBaseCurrency(
      nextCurrency
    );

    setCurrencyMessage("");
    setCurrencyError("");

    const result =
      saveHouseholdCurrency(
        nextCurrency
      );

    if (!result) {
      setCurrencyError(
        "Unable to update the household base currency."
      );

      return;
    }

    setCurrencyMessage(
      `Base currency updated to ${result.currency}. Historical amounts were not recomputed.`
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

            <div className="grid gap-2 border-t pt-4">
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
                  handleBaseCurrencyChange(
                    event.target.value
                  )
                }
                disabled={!household}
                className="max-w-xs rounded-md border bg-background px-3 py-2 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-60"
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

              <p className="text-xs text-muted-foreground">
                This changes the household base display
                currency going forward. It does not convert
                or recompute historical records.
              </p>

              <p className="text-xs text-muted-foreground">
                Future API conversion will store the rate
                effective on the date a record is created
                or used.
              </p>

              {currencyMessage && (
                <p className="text-sm font-medium text-success">
                  {currencyMessage}
                </p>
              )}

              {currencyError && (
                <p className="text-sm font-medium text-destructive">
                  {currencyError}
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
