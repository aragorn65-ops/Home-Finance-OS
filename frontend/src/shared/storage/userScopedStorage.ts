import { isAuthFeatureEnabled } from "../../config/auth";

const prefix = "hfos.user.v1:";

/** Logical account isolation, not encryption against access to browser storage. */
export class UserScopedStorage {
  private userId: string | null = null;
  private generation = 0;

  select(userId: string | null): void {
    if (this.userId !== userId) {
      this.userId = userId;
      this.generation += 1;
    }
  }

  lock(): void {
    this.userId = null;
    this.generation += 1;
  }

  currentUserId(): string | null { return this.userId; }

  view(storage: Storage): Storage | null {
    const userId = this.userId;
    if (!userId) return null;
    const generation = this.generation;
    const userPrefix = `${prefix}${encodeURIComponent(userId)}:`;
    const assertCurrent = () => {
      if (generation !== this.generation || userId !== this.userId) {
        throw new Error("The signed-in storage session changed. Reload before continuing.");
      }
    };
    const keys = () => {
      assertCurrent();
      const result: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key?.startsWith(userPrefix)) result.push(key.slice(userPrefix.length));
      }
      return result;
    };
    return {
      get length() { return keys().length; },
      key(index) { return keys()[index] ?? null; },
      getItem(key) { assertCurrent(); return storage.getItem(userPrefix + key); },
      setItem(key, value) { assertCurrent(); storage.setItem(userPrefix + key, value); },
      removeItem(key) { assertCurrent(); storage.removeItem(userPrefix + key); },
      clear() { for (const key of keys()) storage.removeItem(userPrefix + key); },
    };
  }
}

export const applicationStorageScope = new UserScopedStorage();

export const legacyBrowserPreferenceKeys = ["hfos.v1.app-lock", "hfos.themePreference"] as const;

export function preserveLegacyBrowserPreferences(storage: Storage): void {
  // Preserve the pre-upgrade browser lock; namespacing must not silently disable it.
  // These browser-wide preferences contain no financial records or auth tokens.
  for (const key of legacyBrowserPreferenceKeys) {
    if (storage.getItem(key) !== null) continue;
    const legacy = window.localStorage.getItem(key);
    if (legacy !== null) storage.setItem(key, legacy);
  }
}

export function getApplicationStorage(kind: "localStorage" | "sessionStorage" = "localStorage"): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const storage = window[kind];
    return isAuthFeatureEnabled() ? applicationStorageScope.view(storage) : storage;
  } catch {
    return null;
  }
}
