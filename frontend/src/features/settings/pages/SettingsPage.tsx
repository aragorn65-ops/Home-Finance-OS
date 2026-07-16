import {
  useState,
} from "react";

import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";

import {
  reloadAfterApplicationReset,
  resetApplicationData,
} from "../../startup/services/applicationDataReset";

export default function SettingsPage() {
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

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Configure and manage your household application data"
      />

      <div className="space-y-6">
        <Card>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Household Settings
            </h2>

            <p className="text-sm text-slate-600">
              Household profile and preference controls
              will be added in a future sprint.
            </p>
          </div>
        </Card>

        <Card>
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-red-700">
                Reset Application Data
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Permanently remove the household, members,
                accounts, transactions, expense allocations,
                utility bills, settlements, and settlement
                applications stored in this browser.
              </p>

              <p className="mt-2 text-sm font-medium text-red-700">
                This action cannot be undone.
              </p>
            </div>

            {resetError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {resetError}
              </div>
            )}

            {!isConfirmingReset ? (
              <button
                type="button"
                onClick={handleBeginReset}
                className="rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Reset All Application Data
              </button>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Confirm permanent deletion
                </p>

                <p className="mt-1 text-sm text-red-700">
                  All locally stored HFOS data will be deleted
                  and the application will return to household
                  setup.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    disabled={isResetting}
                    className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isResetting
                      ? "Resetting..."
                      : "Permanently Delete All Data"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelReset}
                    disabled={isResetting}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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