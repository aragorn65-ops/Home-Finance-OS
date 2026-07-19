import {
  authFeatureConfig,
} from "../../../config/auth";

import type {
  AuthDiagnostics,
} from "../models";
import {
  InMemoryAuthBackendAdapter,
} from "./inMemoryAuthBackendAdapter";
import {
  getAuthBackendAdapter,
} from "./createAuthBackendAdapter";

export async function createAuthDiagnostics():
  Promise<AuthDiagnostics> {
  const adapter =
    getAuthBackendAdapter();
  const session =
    await adapter.getSession();
  const memberships =
    await adapter.listMemberships();
  const invitations =
    await adapter.listInvitations();

  return {
    enabled:
      authFeatureConfig.enabled,
    provider:
      authFeatureConfig.provider,
    sessionStatus:
      session.status,
    isPrototypeAdapter:
      adapter instanceof
      InMemoryAuthBackendAdapter,
    membershipCount:
      memberships.length,
    invitationCount:
      invitations.length,
  };
}
