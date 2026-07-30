export interface BuildInfo {
  commit: string;
  shortCommit: string;
  branch: string;
  builtAt: string;
}

function getEnvValue(
  key: string,
  fallback: string
): string {
  const env =
    import.meta.env as Record<
      string,
      string | undefined
    >;

  const value =
    env[key]?.trim();

  return value || fallback;
}

const commit =
  getEnvValue(
    "VITE_HFOS_BUILD_COMMIT",
    "local"
  );

export const buildInfo:
  BuildInfo = {
  commit,
  shortCommit:
    commit.slice(0, 7),
  branch:
    getEnvValue(
      "VITE_HFOS_BUILD_BRANCH",
      "local"
    ),
  builtAt:
    getEnvValue(
      "VITE_HFOS_BUILD_TIME",
      "unknown"
    ),
};
