export interface BuildInfo {
  commit: string;
  shortCommit: string;
  branch: string;
  builtAt: string;
}

export type BuildInfoEnvironment =
  Record<string, string | undefined>;

function getEnvValue(
  env: BuildInfoEnvironment,
  key: string,
  fallback: string
): string {
  const value =
    env[key]?.trim();

  return value || fallback;
}

export function createBuildInfo(
  env: BuildInfoEnvironment
): BuildInfo {
  const commit =
    getEnvValue(
      env,
      "VITE_HFOS_BUILD_COMMIT",
      "local"
    );

  return {
    commit,
    shortCommit:
      commit.slice(0, 7),
    branch:
      getEnvValue(
        env,
        "VITE_HFOS_BUILD_BRANCH",
        "local"
      ),
    builtAt:
      getEnvValue(
        env,
        "VITE_HFOS_BUILD_TIME",
        "unknown"
      ),
  };
}

export const buildInfo =
  createBuildInfo(
    import.meta.env ??
      {}
  );
