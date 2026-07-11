import type { HouseholdSetupState } from "../hooks/useHouseholdSetup";

const STORAGE_KEY = "hfos.household";

export function saveHousehold(
  household: HouseholdSetupState
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(household)
  );
}

export function loadHousehold() {
  const json = localStorage.getItem(STORAGE_KEY);

  if (!json) return null;

  return JSON.parse(json) as HouseholdSetupState;
}

export function clearHousehold() {
  localStorage.removeItem(STORAGE_KEY);
}