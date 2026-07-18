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

      return;
    }

    const validation =
      validateApplicationBackup(
        json
      );

    if (!validation.success) {
      setRestoreError(
        validation.message
      );

      return;
    }

    setRestoreFilename(file.name);
    setRestoreJson(json);
    setIsConfirmingRestore(true);
  }

  function cancelRestore() {
    setRestoreError("");
    setRestoreFilename("");
    setRestoreJson("");
    setIsConfirmingRestore(false);

    if (restoreFileInputRef.current) {
      restoreFileInputRef
        .current
        .value = "";
    }
  }

  function confirmRestore() {
    setRestoreError("");
    setIsRestoring(true);

    const result =
      restoreApplicationBackup(
        restoreJson
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
              Restoring {restoreFilename} will replace
              current HFOS data in this browser.
            </p>

            <div className="household-restore__actions">
              <button
                type="button"
                onClick={confirmRestore}
                disabled={isRestoring}
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
