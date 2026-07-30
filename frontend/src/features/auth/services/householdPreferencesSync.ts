import type {
  RemoteHousehold,
} from "../models";

import type {
  AuthBackendAdapter,
} from "./AuthBackendAdapter";

export interface LinkedHouseholdPreferencesHousehold {
  id: string;
  authenticatedLink?: {
    remoteHouseholdId: string;
  };
}

export interface HouseholdPreferencesLocalWriter {
  replacePreferences(
    preferences: {
      householdName: string;
      country: string;
      currency: string;
      timezone: string;
    }
  ): boolean;
}

export type HouseholdPreferencesAdapter =
  Pick<
    AuthBackendAdapter,
    "loadRemoteHousehold"
  >;

export interface LinkedHouseholdPreferencesRestoreOptions {
  authEnabled: boolean;
  household:
    | LinkedHouseholdPreferencesHousehold
    | null
    | undefined;
  adapter: HouseholdPreferencesAdapter;
  writer: HouseholdPreferencesLocalWriter;
}

export type LinkedHouseholdPreferencesRestoreResult =
  | {
      status: "skipped";
      reason:
        | "auth-disabled"
        | "missing-household"
        | "unlinked-household";
    }
  | {
      status: "restored";
      household: RemoteHousehold;
    };

export async function restoreLinkedRemoteHouseholdPreferences(
  options: LinkedHouseholdPreferencesRestoreOptions
): Promise<LinkedHouseholdPreferencesRestoreResult> {
  if (!options.authEnabled) {
    return {
      status: "skipped",
      reason: "auth-disabled",
    };
  }

  if (!options.household) {
    return {
      status: "skipped",
      reason: "missing-household",
    };
  }

  const remoteHouseholdId =
    options.household.authenticatedLink
      ?.remoteHouseholdId;

  if (!remoteHouseholdId) {
    return {
      status: "skipped",
      reason: "unlinked-household",
    };
  }

  const remoteHousehold =
    await options.adapter
      .loadRemoteHousehold(
        remoteHouseholdId
      );

  const preferences =
    createLocalPreferences(
      remoteHousehold
    );

  if (
    !options.writer.replacePreferences(
      preferences
    )
  ) {
    throw new Error(
      "Local household preferences could not be replaced from the cloud household."
    );
  }

  return {
    status: "restored",
    household:
      remoteHousehold,
  };
}

function createLocalPreferences(
  household: RemoteHousehold
): {
  householdName: string;
  country: string;
  currency: string;
  timezone: string;
} {
  if (
    !household.name.trim() ||
    !household.country?.trim() ||
    !household.currency?.trim() ||
    !household.timezone?.trim()
  ) {
    throw new Error(
      "Cloud household preferences are incomplete."
    );
  }

  return {
    householdName:
      household.name.trim(),
    country:
      household.country.trim(),
    currency:
      household.currency
        .trim()
        .toUpperCase(),
    timezone:
      household.timezone.trim(),
  };
}
