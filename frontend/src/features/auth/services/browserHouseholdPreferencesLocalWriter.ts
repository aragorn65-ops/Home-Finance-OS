import {
  saveHouseholdPreferences,
} from "../../household/services/householdStorage";

import type {
  HouseholdPreferencesLocalWriter,
} from "./householdPreferencesSync";

export const browserHouseholdPreferencesLocalWriter:
  HouseholdPreferencesLocalWriter = {
  replacePreferences(
    preferences
  ) {
    return Boolean(
      saveHouseholdPreferences(
        preferences
      )
    );
  },
};
