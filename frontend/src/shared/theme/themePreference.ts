export type ThemePreference =
  | "system"
  | "light"
  | "dark";

const themePreferenceStorageKey =
  "hfos.themePreference";

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedPreference =
    window.localStorage.getItem(
      themePreferenceStorageKey
    );

  if (
    storedPreference === "light" ||
    storedPreference === "dark" ||
    storedPreference === "system"
  ) {
    return storedPreference;
  }

  return "system";
}

export function applyThemePreference(
  preference: ThemePreference
): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme =
    preference;
}

export function storeThemePreference(
  preference: ThemePreference
): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      themePreferenceStorageKey,
      preference
    );
  }

  applyThemePreference(
    preference
  );
}
