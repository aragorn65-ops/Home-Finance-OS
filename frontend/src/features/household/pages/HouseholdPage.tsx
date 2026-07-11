import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Wizard from "../../../shared/ui/Wizard";

import HouseholdNameStep from "../components/HouseholdNameStep";
import CountryStep from "../components/CountryStep";
import CurrencyStep from "../components/CurrencyStep";
import TimezoneStep from "../components/TimezoneStep";
import ReviewStep from "../components/ReviewStep";

import { useHouseholdSetup } from "../hooks/useHouseholdSetup";

import { saveHousehold } from "../services/householdStorage";

import {
  HOUSEHOLD_SETUP_STEPS,
  TOTAL_STEPS,
} from "../constants/wizardSteps";

export default function HouseholdPage() {
  const navigate = useNavigate();

  const { state, update } = useHouseholdSetup();

  const [currentStep, setCurrentStep] = useState(
    HOUSEHOLD_SETUP_STEPS.HOUSEHOLD_NAME
  );

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

  function createHousehold() {
    saveHousehold(state);

    navigate("/app", {
      replace: true,
    });
  }

  return (
    <Wizard
      title="Welcome Home"
      description="Let's create your household. This only takes a minute."
      currentStep={currentStep + 1}
      totalSteps={TOTAL_STEPS}
    >
      {currentStep === HOUSEHOLD_SETUP_STEPS.HOUSEHOLD_NAME && (
        <HouseholdNameStep
          value={state.householdName}
          onChange={(value) =>
            update("householdName", value)
          }
          onNext={nextStep}
        />
      )}

      {currentStep === HOUSEHOLD_SETUP_STEPS.COUNTRY && (
        <CountryStep
          value={state.country}
          onChange={(value) =>
            update("country", value)
          }
          onNext={nextStep}
          onBack={previousStep}
        />
      )}

      {currentStep === HOUSEHOLD_SETUP_STEPS.CURRENCY && (
        <CurrencyStep
          value={state.currency}
          onChange={(value) =>
            update("currency", value)
          }
          onNext={nextStep}
          onBack={previousStep}
        />
      )}

      {currentStep === HOUSEHOLD_SETUP_STEPS.TIMEZONE && (
        <TimezoneStep
          value={state.timezone}
          onChange={(value) =>
            update("timezone", value)
          }
          onNext={nextStep}
          onBack={previousStep}
        />
      )}

      {currentStep === HOUSEHOLD_SETUP_STEPS.REVIEW && (
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
  );
}