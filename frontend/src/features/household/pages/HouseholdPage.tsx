import "./HouseholdPage.css";

import {
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import Wizard from "../../../shared/ui/Wizard";
import {
  getCountryDefaults,
} from "../../../shared/data/countryDefaults";

import HouseholdNameStep from "../components/HouseholdNameStep";
import CountryStep from "../components/CountryStep";
import CurrencyStep from "../components/CurrencyStep";
import TimezoneStep from "../components/TimezoneStep";
import ReviewStep from "../components/ReviewStep";

import { useHouseholdSetup } from "../hooks/useHouseholdSetup";

import { saveHousehold } from "../services/householdStorage";
import {
  restoreApplicationBackup,
  validateApplicationBackup,
  type ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";

import {
  HOUSEHOLD_SETUP_STEPS,
  TOTAL_STEPS,
} from "../constants/wizardSteps";

export default function HouseholdPage() {
  const navigate = useNavigate();

  const restoreFileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const { state, update } = useHouseholdSetup();

  const [currentStep, setCurrentStep] =
    useState<number>(
      HOUSEHOLD_SETUP_STEPS.HOUSEHOLD_NAME
    );

  const [
    restoreError,
    setRestoreError,
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
    isRestoring,
    setIsRestoring,
  ] = useState(false);

  function nextStep() {
    setCurrentStep((step) =>
      Math.min(step + 1, TOTAL_STEPS - 1)
    );
  }

  function previousStep() {
    setCurrentStep((step) =>
      Math.max(step - 1, 0)
    );
  }

  function handleCountryChange(
    country: string
  ) {
    const defaults =
      getCountryDefaults(country);

    update("country", country);

    if (defaults) {
      update(
        "currency",
        defaults.currency
      );
      update(
        "timezone",
        defaults.timezone
      );
    }
  }

  function createHousehold() {
    saveHousehold(state);

    navigate("/app", {
      replace: true,
    });
  }

  async function handleSelectBackupFile(
    file: File | undefined
  ) {
    setRestoreError("");
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
      setRestoreError(
        "Backup file could not be read."
      );
      resetRestoreFileInput();

      return;
    }

    const validation =
      await validateApplicationBackup(
        json
      );

    if (!validation.success) {
      if (
        validation.requiresPassword
      ) {
        setRestoreFilename(file.name);
        setRestoreJson(json);
        setRestoreSummary(undefined);
        setRestorePassword("");
        setRestoreNeedsPassword(true);
        setIsConfirmingRestore(true);

        return;
      }

      setRestoreError(
        validation.message
      );
      resetRestoreFileInput();

      return;
    }

    setRestoreFilename(file.name);
    setRestoreJson(json);
    setRestoreSummary(
      validation.summary
    );
    setRestorePassword("");
    setRestoreNeedsPassword(false);
    setIsConfirmingRestore(true);
  }

  async function unlockRestoreBackup() {
    setRestoreError("");

    const validation =
      await validateApplicationBackup(
        restoreJson,
        restorePassword
      );

    if (!validation.success) {
      setRestoreError(
        validation.message
      );

      return;
    }

    setRestoreSummary(
      validation.summary
    );
    setRestoreNeedsPassword(false);
  }

  function cancelRestore() {
    setRestoreError("");
    setRestoreFilename("");
    setRestoreJson("");
    setRestoreSummary(undefined);
    setRestorePassword("");
    setRestoreNeedsPassword(false);
    setIsConfirmingRestore(false);

    resetRestoreFileInput();
  }

  async function confirmRestore() {
    setRestoreError("");
    setIsRestoring(true);

    const result =
      await restoreApplicationBackup(
        restoreJson,
        restorePassword
      );

    if (!result.success) {
      setRestoreError(
        result.message
      );
      setIsRestoring(false);

      return;
    }

    navigate("/app", {
      replace: true,
    });
  }

  function resetRestoreFileInput() {
    if (restoreFileInputRef.current) {
      restoreFileInputRef
        .current
        .value = "";
    }
  }

  return (
    <div className="household-setup-page">
      <Wizard
        title="Welcome Home"
        description="Let's create your household. This only takes a minute."
        currentStep={currentStep + 1}
        totalSteps={TOTAL_STEPS}
      >
        {currentStep ===
          HOUSEHOLD_SETUP_STEPS.HOUSEHOLD_NAME && (
          <HouseholdNameStep
            value={state.householdName}
            onChange={(value) =>
              update("householdName", value)
            }
            onNext={nextStep}
          />
        )}

        {currentStep ===
          HOUSEHOLD_SETUP_STEPS.COUNTRY && (
          <CountryStep
            value={state.country}
            onChange={(value) =>
              handleCountryChange(value)
            }
            onNext={nextStep}
            onBack={previousStep}
          />
        )}

        {currentStep ===
          HOUSEHOLD_SETUP_STEPS.CURRENCY && (
          <CurrencyStep
            value={state.currency}
            onChange={(value) =>
              update("currency", value)
            }
            onNext={nextStep}
            onBack={previousStep}
          />
        )}

        {currentStep ===
          HOUSEHOLD_SETUP_STEPS.TIMEZONE && (
          <TimezoneStep
            value={state.timezone}
            onChange={(value) =>
              update("timezone", value)
            }
            onNext={nextStep}
            onBack={previousStep}
          />
        )}

        {currentStep ===
          HOUSEHOLD_SETUP_STEPS.REVIEW && (
          <ReviewStep
            householdName={state.householdName}
            country={state.country}
            currency={state.currency}
            timezone={state.timezone}
            onBack={previousStep}
            onCreate={createHousehold}
          />
        )}
      </Wizard>

      <section className="household-restore">
        <div>
          <h2>Restore from Backup</h2>

          <p>
            Import a local HFOS backup instead of creating a
            new household.
          </p>
        </div>

        {restoreError && (
          <p
            role="alert"
            className="household-restore__error"
          >
            {restoreError}
          </p>
        )}

        {!isConfirmingRestore ? (
          <label className="household-restore__button">
            <span>
              Import Backup
            </span>

            <input
              ref={restoreFileInputRef}
              type="file"
              accept=".json,.hfos-backup.json,application/json"
              onChange={(event) => {
                void handleSelectBackupFile(
                  event.target.files?.[0]
                );
              }}
            />
          </label>
        ) : (
          <div className="household-restore__confirm">
            <p>
              {restoreNeedsPassword
                ? `Enter the backup password for ${restoreFilename} before restoring.`
                : `Restoring ${restoreFilename} will replace current HFOS data in this browser.`}
            </p>

            {restoreNeedsPassword && (
              <div className="household-restore__password">
                <label htmlFor="household-restore-password">
                  Backup Password
                </label>

                <input
                  id="household-restore-password"
                  type="password"
                  value={restorePassword}
                  onChange={(event) =>
                    setRestorePassword(
                      event.target.value
                    )
                  }
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => {
                    void unlockRestoreBackup();
                  }}
                  disabled={
                    restorePassword.length ===
                    0
                  }
                >
                  Unlock Backup
                </button>
              </div>
            )}

            {restoreSummary && (
              <dl className="household-restore__summary">
                <div>
                  <dt>Household</dt>
                  <dd>
                    {
                      restoreSummary.householdName
                    }
                  </dd>
                </div>

                <div>
                  <dt>Exported</dt>
                  <dd>
                    {formatBackupDate(
                      restoreSummary.exportedAt
                    )}
                  </dd>
                </div>

                {restoreSummary.storageSchemaVersion !==
                  undefined && (
                  <div>
                    <dt>Schema</dt>
                    <dd>
                      v{
                        restoreSummary
                          .storageSchemaVersion
                      }
                    </dd>
                  </div>
                )}

                {restoreSummary.backupVersion !==
                  undefined && (
                  <div>
                    <dt>Backup</dt>
                    <dd>
                      v{
                        restoreSummary
                          .backupVersion
                      }
                    </dd>
                  </div>
                )}

                {restoreSummary.themePreference && (
                  <div>
                    <dt>Theme</dt>
                    <dd>
                      {formatThemePreference(
                        restoreSummary
                          .themePreference
                      )}
                    </dd>
                  </div>
                )}

                {restoreSummary.passwordProtected && (
                  <div>
                    <dt>Protection</dt>
                    <dd>Password protected</dd>
                  </div>
                )}

                <div>
                  <dt>Accounts</dt>
                  <dd>
                    {
                      restoreSummary.accountCount
                    }
                  </dd>
                </div>

                <div>
                  <dt>Transactions</dt>
                  <dd>
                    {
                      restoreSummary
                        .transactionCount
                    }
                  </dd>
                </div>

                {restoreSummary.expenseAllocationCount !==
                  undefined && (
                  <div>
                    <dt>Allocations</dt>
                    <dd>
                      {
                        restoreSummary
                          .expenseAllocationCount
                      }
                    </dd>
                  </div>
                )}

                <div>
                  <dt>Settlements</dt>
                  <dd>
                    {
                      restoreSummary
                        .settlementCount
                    }
                  </dd>
                </div>

                {restoreSummary.settlementApplicationCount !==
                  undefined && (
                  <div>
                    <dt>Applications</dt>
                    <dd>
                      {
                        restoreSummary
                          .settlementApplicationCount
                      }
                    </dd>
                  </div>
                )}

                <div>
                  <dt>Savings Goals</dt>
                  <dd>
                    {
                      restoreSummary
                      .savingsGoalCount
                    }
                  </dd>
                </div>

                {restoreSummary.savingsActivityCount !==
                  undefined && (
                  <div>
                    <dt>Savings Activity</dt>
                    <dd>
                      {
                        restoreSummary
                          .savingsActivityCount
                      }
                    </dd>
                  </div>
                )}
              </dl>
            )}

            <div className="household-restore__actions">
              <button
                type="button"
                onClick={() => {
                  void confirmRestore();
                }}
                disabled={
                  isRestoring ||
                  restoreNeedsPassword
                }
              >
                {isRestoring
                  ? "Restoring..."
                  : "Restore Backup"}
              </button>

              <button
                type="button"
                onClick={cancelRestore}
                disabled={isRestoring}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
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
