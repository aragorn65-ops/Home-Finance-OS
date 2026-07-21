export class MemoryStorage
  implements Storage
{
  private readonly values =
    new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string):
    string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [
      ...this.values.keys(),
    ][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(
    key: string,
    value: string
  ): void {
    this.values.set(
      key,
      String(value)
    );
  }
}

export function installBrowserStorage() {
  const localStorage =
    new MemoryStorage();
  const sessionStorage =
    new MemoryStorage();

  Object.defineProperty(
    globalThis,
    "window",
    {
      configurable: true,
      value: {
        localStorage,
        sessionStorage,
      },
    }
  );

  Object.defineProperty(
    globalThis,
    "localStorage",
    {
      configurable: true,
      value:
        localStorage,
    }
  );

  Object.defineProperty(
    globalThis,
    "sessionStorage",
    {
      configurable: true,
      value:
        sessionStorage,
    }
  );

  return {
    localStorage,
    sessionStorage,
  };
}

export function createStorageEnvelope(
  data: unknown
) {
  return {
    schemaVersion: 1,
    savedAt:
      "2026-07-21T00:00:00.000Z",
    data,
  };
}

export function createLinkedHousehold() {
  return {
    id: "household-local-1",
    householdName:
      "Linked Household",
    country: "PH",
    currency: "PHP",
    timezone: "Asia/Manila",
    authenticatedLink: {
      remoteHouseholdId:
        "household-remote-1",
      migrationId:
        "migration-1",
      ownerMemberId:
        "member-owner-1",
      linkedByUserId:
        "user-1",
      linkedAt:
        "2026-07-21T01:00:00.000Z",
    },
    members: [
      {
        id: "member-owner-1",
        householdId:
          "household-local-1",
        displayName:
          "Owner",
        role: "owner",
        isActive: true,
        createdAt:
          "2026-07-21T00:00:00.000Z",
        updatedAt:
          "2026-07-21T00:00:00.000Z",
      },
    ],
    createdAt:
      "2026-07-21T00:00:00.000Z",
    updatedAt:
      "2026-07-21T00:00:00.000Z",
  };
}
