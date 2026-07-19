import {
  isAuthFeatureEnabled,
} from "../../../config/auth";

import type {
  AuthBackendAdapter,
} from "./AuthBackendAdapter";
import {
  DisabledAuthBackendAdapter,
} from "./disabledAuthBackendAdapter";

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

  return new DisabledAuthBackendAdapter();
}
