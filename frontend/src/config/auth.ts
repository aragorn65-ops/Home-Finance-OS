export type AuthProvider =
  | "none"
  | "supabase"
  | "firebase"
  | "custom";

export interface AuthFeatureConfig {
  enabled: boolean;
  provider: AuthProvider;
}

const authEnabledValue =
  import.meta.env
    .VITE_HFOS_AUTH_ENABLED;

const authProviderValue =
  import.meta.env
    .VITE_HFOS_AUTH_PROVIDER;

export const authFeatureConfig:
  AuthFeatureConfig = {
  enabled:
    authEnabledValue === "true",
  provider:
    normalizeAuthProvider(
      authProviderValue
    ),
};

export function isAuthFeatureEnabled():
  boolean {
  return (
    authFeatureConfig.enabled &&
    authFeatureConfig.provider !==
      "none"
  );
}

function normalizeAuthProvider(
  value: string | undefined
): AuthProvider {
  if (
    value === "supabase" ||
    value === "firebase" ||
    value === "custom"
  ) {
    return value;
  }

  return "none";
}
