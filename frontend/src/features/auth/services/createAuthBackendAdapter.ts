import {
  authFeatureConfig,
  isAuthFeatureEnabled,
} from "../../../config/auth";

import type {
  AuthBackendAdapter,
} from "./AuthBackendAdapter";
import {
  DisabledAuthBackendAdapter,
} from "./disabledAuthBackendAdapter";
import {
  InMemoryAuthBackendAdapter,
} from "./inMemoryAuthBackendAdapter";

let adapter:
  AuthBackendAdapter | undefined;

export function getAuthBackendAdapter():
  AuthBackendAdapter {
  if (!adapter) {
    adapter =
      createAuthBackendAdapter();
  }

  return adapter;
}

function createAuthBackendAdapter():
  AuthBackendAdapter {
  if (!isAuthFeatureEnabled()) {
    return new DisabledAuthBackendAdapter();
  }

  if (
    authFeatureConfig.provider ===
    "prototype"
  ) {
    return new InMemoryAuthBackendAdapter();
  }

  return new DisabledAuthBackendAdapter();
}
