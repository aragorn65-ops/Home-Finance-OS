import type { HouseholdMember } from "../models/HouseholdMember";
import type { HouseholdSetupState } from "../hooks/useHouseholdSetup";

import {
  HFOS_LEGACY_STORAGE_KEYS,
  HFOS_STORAGE_KEYS,
  loadLegacyStoredData,
  loadStoredData,
  removeLegacyStoredData,
  removeStoredData,
  saveStoredData,
} from "../../../shared/storage/localStorageStore";

export interface StoredHousehold {
  id: string;

  householdName: string;
  country: string;
  currency: string;
  timezone: string;

  members: HouseholdMember[];

  createdAt: Date;
  updatedAt: Date;
}

interface SerializedHouseholdMember
  extends Omit<
    HouseholdMember,
    "createdAt" | "updatedAt"
  > {
  createdAt: string;
  updatedAt: string;
}

interface SerializedStoredHousehold
  extends Omit<
    StoredHousehold,
    "members" | "createdAt" | "updatedAt"
  > {
  members: SerializedHouseholdMember[];

  createdAt: string;
  updatedAt: string;
}

interface LegacyStoredHousehold {
  householdName: string;
  country: string;
  currency: string;
  timezone: string;
}

type LegacyHouseholdPayload =
  | SerializedStoredHousehold
  | LegacyStoredHousehold;

/**
 * Creates or updates the single stored household.
 *
 * Existing members and the original creation date are
 * preserved when household setup details are updated.
 */
export function saveHousehold(
  household: HouseholdSetupState,
  members?: HouseholdMember[]
): StoredHousehold {
  const existing =
    loadHousehold();

  const now =
    new Date();

  const storedHousehold:
    StoredHousehold = {
      id:
        existing?.id ??
        crypto.randomUUID(),

      householdName:
        household.householdName.trim(),

      country:
        household.country.trim(),

      currency:
        household.currency.trim(),

      timezone:
        household.timezone.trim(),

      members:
        members?.map(
          (member) =>
            cloneMember(member)
        ) ??
        existing?.members.map(
          (member) =>
            cloneMember(member)
        ) ??
        [],

      createdAt:
        existing?.createdAt
          ? new Date(
              existing.createdAt
            )
          : now,

      updatedAt: now,
    };

  persistHousehold(
    storedHousehold
  );

  return cloneHousehold(
    storedHousehold
  );
}

/**
 * Loads the single active household.
 *
 * The current versioned record is preferred.
 *
 * When no versioned record exists, the previous
 * unversioned household record is migrated without
 * replacing its household ID or member IDs.
 */
export function loadHousehold():
  StoredHousehold | null {
  const loadResult =
    loadStoredData<
      SerializedStoredHousehold
    >(
      HFOS_STORAGE_KEYS.household,
      isSerializedStoredHousehold
    );

  if (
    loadResult.status ===
    "loaded"
  ) {
    return deserializeHousehold(
      loadResult.data as
        SerializedStoredHousehold
    );
  }

  /**
   * Do not fall back to legacy data when a versioned
   * record exists but is malformed or unsupported.
   *
   * This prevents stale legacy data from silently
   * replacing a newer household record.
   */
  if (
    loadResult.status !==
    "missing"
  ) {
    return null;
  }

  return migrateLegacyStorage();
}

/**
 * Replaces the household member collection while
 * preserving all other household data.
 */
export function saveHouseholdMembers(
  members: HouseholdMember[]
): StoredHousehold | null {
  const household =
    loadHousehold();

  if (!household) {
    return null;
  }

  const updatedHousehold:
    StoredHousehold = {
      ...household,

      members:
        members.map(
          (member) =>
            cloneMember(member)
        ),

      updatedAt:
        new Date(),
    };

  const saved =
    persistHousehold(
      updatedHousehold
    );

  if (!saved) {
    return null;
  }

  return cloneHousehold(
    updatedHousehold
  );
}

/**
 * Updates the household base currency without changing
 * historical record amounts.
 */
export function saveHouseholdCurrency(
  currency: string
): StoredHousehold | null {
  const household =
    loadHousehold();

  const normalizedCurrency =
    currency.trim().toUpperCase();

  if (
    !household ||
    !normalizedCurrency
  ) {
    return null;
  }

  const updatedHousehold:
    StoredHousehold = {
      ...household,

      currency:
        normalizedCurrency,

      updatedAt:
        new Date(),
    };

  const saved =
    persistHousehold(
      updatedHousehold
    );

  if (!saved) {
    return null;
  }

  return cloneHousehold(
    updatedHousehold
  );
}

/**
 * Updates setup preferences after household creation.
 *
 * Changing the base currency only affects future display
 * defaults. Existing financial records keep their stored
 * amounts and exchange-rate metadata.
 */
export function saveHouseholdPreferences(
  preferences: Pick<
    HouseholdSetupState,
    "country" | "currency" | "timezone"
  >
): StoredHousehold | null {
  const household =
    loadHousehold();

  const country =
    preferences.country.trim();

  const currency =
    preferences.currency
      .trim()
      .toUpperCase();

  const timezone =
    preferences.timezone.trim();

  if (
    !household ||
    !country ||
    !currency ||
    !timezone
  ) {
    return null;
  }

  const updatedHousehold:
    StoredHousehold = {
      ...household,

      country,
      currency,
      timezone,

      updatedAt:
        new Date(),
    };

  const saved =
    persistHousehold(
      updatedHousehold
    );

  if (!saved) {
    return null;
  }

  return cloneHousehold(
    updatedHousehold
  );
}

/**
 * Removes the current and legacy household records.
 *
 * Related financial storage is removed separately by
 * the explicit application-data reset workflow.
 */
export function clearHousehold(): void {
  removeStoredData(
    HFOS_STORAGE_KEYS.household
  );

  removeLegacyStoredData(
    HFOS_LEGACY_STORAGE_KEYS.household
  );
}

/**
 * Loads and migrates the previous unversioned household
 * storage record.
 */
function migrateLegacyStorage():
  StoredHousehold | null {
  const legacyResult =
    loadLegacyStoredData<
      LegacyHouseholdPayload
    >(
      HFOS_LEGACY_STORAGE_KEYS
        .household,

      isLegacyHouseholdPayload
    );

  if (
    legacyResult.status !==
      "loaded" ||
    !legacyResult.data
  ) {
    return null;
  }

  const legacyPayload =
    legacyResult.data;

  const household =
    isSerializedStoredHousehold(
      legacyPayload
    )
      ? deserializeHousehold(
          legacyPayload
        )
      : migrateSetupOnlyHousehold(
          legacyPayload
        );

  const saved =
    persistHousehold(
      household
    );

  if (saved) {
    removeLegacyStoredData(
      HFOS_LEGACY_STORAGE_KEYS
        .household
    );
  }

  return cloneHousehold(
    household
  );
}

/**
 * Migrates the original setup-only household payload
 * into the complete household storage contract.
 */
function migrateSetupOnlyHousehold(
  legacy: LegacyStoredHousehold
): StoredHousehold {
  const now =
    new Date();

  return {
    id:
      crypto.randomUUID(),

    householdName:
      legacy.householdName.trim(),

    country:
      legacy.country.trim(),

    currency:
      legacy.currency.trim(),

    timezone:
      legacy.timezone.trim(),

    members: [],

    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Writes the complete household record using the shared
 * versioned HFOS storage envelope.
 */
function persistHousehold(
  household: StoredHousehold
): boolean {
  const serialized =
    serializeHousehold(
      household
    );

  const result =
    saveStoredData(
      HFOS_STORAGE_KEYS.household,
      serialized
    );

  return result.success;
}

/**
 * Converts Date values into JSON-safe strings.
 */
function serializeHousehold(
  household: StoredHousehold
): SerializedStoredHousehold {
  return {
    id:
      household.id,

    householdName:
      household.householdName,

    country:
      household.country,

    currency:
      household.currency,

    timezone:
      household.timezone,

    members:
      household.members.map(
        (member) => ({
          ...member,

          createdAt:
            member.createdAt
              .toISOString(),

          updatedAt:
            member.updatedAt
              .toISOString(),
        })
      ),

    createdAt:
      household.createdAt
        .toISOString(),

    updatedAt:
      household.updatedAt
        .toISOString(),
  };
}

/**
 * Restores Date values from persisted strings.
 */
function deserializeHousehold(
  household:
    SerializedStoredHousehold
): StoredHousehold {
  return {
    id:
      household.id,

    householdName:
      household.householdName,

    country:
      household.country,

    currency:
      household.currency,

    timezone:
      household.timezone,

    members:
      household.members.map(
        (member) => ({
          ...member,

          createdAt:
            new Date(
              member.createdAt
            ),

          updatedAt:
            new Date(
              member.updatedAt
            ),
        })
      ),

    createdAt:
      new Date(
        household.createdAt
      ),

    updatedAt:
      new Date(
        household.updatedAt
      ),
  };
}

/**
 * Returns a defensive household copy.
 */
function cloneHousehold(
  household: StoredHousehold
): StoredHousehold {
  return {
    ...household,

    members:
      household.members.map(
        (member) =>
          cloneMember(member)
      ),

    createdAt:
      new Date(
        household.createdAt
      ),

    updatedAt:
      new Date(
        household.updatedAt
      ),
  };
}

/**
 * Returns a defensive member copy.
 */
function cloneMember(
  member: HouseholdMember
): HouseholdMember {
  return {
    ...member,

    createdAt:
      new Date(
        member.createdAt
      ),

    updatedAt:
      new Date(
        member.updatedAt
      ),
  };
}

/**
 * Validates either supported legacy household payload.
 */
function isLegacyHouseholdPayload(
  value: unknown
): value is LegacyHouseholdPayload {
  return (
    isSerializedStoredHousehold(
      value
    ) ||
    isLegacyStoredHousehold(
      value
    )
  );
}

/**
 * Validates the setup-only legacy household payload.
 */
function isLegacyStoredHousehold(
  value: unknown
): value is LegacyStoredHousehold {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.householdName ===
      "string" &&
    typeof value.country ===
      "string" &&
    typeof value.currency ===
      "string" &&
    typeof value.timezone ===
      "string" &&
    typeof value.id !==
      "string"
  );
}

/**
 * Validates the complete serialized household payload.
 */
function isSerializedStoredHousehold(
  value: unknown
): value is SerializedStoredHousehold {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id ===
      "string" &&
    typeof value.householdName ===
      "string" &&
    typeof value.country ===
      "string" &&
    typeof value.currency ===
      "string" &&
    typeof value.timezone ===
      "string" &&
    Array.isArray(
      value.members
    ) &&
    value.members.every(
      (member) =>
        isSerializedHouseholdMember(
          member
        )
    ) &&
    isDateString(
      value.createdAt
    ) &&
    isDateString(
      value.updatedAt
    )
  );
}

/**
 * Validates one serialized household member.
 */
function isSerializedHouseholdMember(
  value: unknown
): value is SerializedHouseholdMember {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id ===
      "string" &&
    typeof value.householdId ===
      "string" &&
    isOptionalString(
      value.userId
    ) &&
    typeof value.displayName ===
      "string" &&
    isHouseholdMemberRole(
      value.role
    ) &&
    isOptionalString(
      value.color
    ) &&
    typeof value.isActive ===
      "boolean" &&
    isDateString(
      value.createdAt
    ) &&
    isDateString(
      value.updatedAt
    )
  );
}

function isHouseholdMemberRole(
  value: unknown
): value is HouseholdMember["role"] {
  return (
    value === "owner" ||
    value === "admin" ||
    value === "member"
  );
}

function isOptionalString(
  value: unknown
): value is string | undefined {
  return (
    value === undefined ||
    typeof value ===
      "string"
  );
}

function isDateString(
  value: unknown
): value is string {
  return (
    typeof value ===
      "string" &&
    !Number.isNaN(
      new Date(value).getTime()
    )
  );
}

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null
  );
}
