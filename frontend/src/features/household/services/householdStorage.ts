import type { HouseholdMember } from "../models/HouseholdMember";
import type { HouseholdSetupState } from "../hooks/useHouseholdSetup";

const STORAGE_KEY = "hfos.household";

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

/**
 * Creates or updates the stored household.
 *
 * Existing members and the original creation date are
 * preserved when household setup details are updated.
 */
export function saveHousehold(
  household: HouseholdSetupState,
  members?: HouseholdMember[]
): StoredHousehold {
  const existing = loadHousehold();
  const now = new Date();

  const storedHousehold: StoredHousehold = {
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
      members ??
      existing?.members ??
      [],

    createdAt:
      existing?.createdAt ??
      now,

    updatedAt: now,
  };

  persistHousehold(storedHousehold);

  return cloneHousehold(
    storedHousehold
  );
}

/**
 * Loads the household record.
 *
 * Legacy setup-only records are automatically upgraded
 * to the current storage contract.
 */
export function loadHousehold():
  StoredHousehold | null {
  const json =
    localStorage.getItem(STORAGE_KEY);

  if (!json) {
    return null;
  }

  try {
    const parsed: unknown =
      JSON.parse(json);

    if (
      isSerializedStoredHousehold(
        parsed
      )
    ) {
      return deserializeHousehold(
        parsed
      );
    }

    if (
      isLegacyStoredHousehold(parsed)
    ) {
      const migratedHousehold =
        migrateLegacyHousehold(parsed);

      persistHousehold(
        migratedHousehold
      );

      return cloneHousehold(
        migratedHousehold
      );
    }

    return null;
  } catch {
    return null;
  }
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

      members: members.map(
        (member) =>
          cloneMember(member)
      ),

      updatedAt: new Date(),
    };

  persistHousehold(
    updatedHousehold
  );

  return cloneHousehold(
    updatedHousehold
  );
}

/**
 * Removes the stored household and all locally persisted
 * household members.
 */
export function clearHousehold(): void {
  localStorage.removeItem(
    STORAGE_KEY
  );
}

/**
 * Migrates the original household setup payload to the
 * current household storage contract.
 */
function migrateLegacyHousehold(
  legacy: LegacyStoredHousehold
): StoredHousehold {
  const now = new Date();

  return {
    id: crypto.randomUUID(),

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
 * Writes a household record to local storage.
 */
function persistHousehold(
  household: StoredHousehold
): void {
  const serialized =
    serializeHousehold(household);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(serialized)
  );
}

/**
 * Converts Date values into JSON-safe strings.
 */
function serializeHousehold(
  household: StoredHousehold
): SerializedStoredHousehold {
  return {
    id: household.id,

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
            member.createdAt.toISOString(),

          updatedAt:
            member.updatedAt.toISOString(),
        })
      ),

    createdAt:
      household.createdAt.toISOString(),

    updatedAt:
      household.updatedAt.toISOString(),
  };
}

/**
 * Restores Date values from persisted strings.
 */
function deserializeHousehold(
  household: SerializedStoredHousehold
): StoredHousehold {
  return {
    id: household.id,

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

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

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
    Array.isArray(value.members) &&
    typeof value.createdAt ===
      "string" &&
    typeof value.updatedAt ===
      "string"
  );
}