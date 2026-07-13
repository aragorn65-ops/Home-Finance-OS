import { useState } from "react";

export interface HouseholdSetupState {
  householdName: string;
  country: string;
  currency: string;
  timezone: string;
}

export function useHouseholdSetup() {
  const [state, setState] =
    useState<HouseholdSetupState>({
      householdName: "",
      country: "",
      currency: "",
      timezone: "",
    });

  function update<K extends keyof HouseholdSetupState>(
    field: K,
    value: HouseholdSetupState[K]
  ) {
    setState((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  return {
    state,
    update,
  };
}