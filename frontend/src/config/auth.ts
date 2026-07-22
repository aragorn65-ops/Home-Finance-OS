export type AuthProvider =
  | "none"
  | "prototype"
  | "supabase"
  | "firebase"
  | "custom";

export interface AuthFeatureConfig {
  enabled: boolean;
  provider: AuthProvider;
}

const viteEnv =
  import.meta.env ?? {};

const authEnabledValue =
  viteEnv
    .VITE_HFOS_AUTH_ENABLED;

const authProviderValue =
  viteEnv
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
    value === "prototype" ||
    value === "supabase" ||
    value === "firebase" ||
    value === "custom"
  ) {
    return value;
  }

  return "none";
}
