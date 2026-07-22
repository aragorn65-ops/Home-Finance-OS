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
  SupabaseAuthBackendAdapter,
} from "./supabaseAuthBackendAdapter";
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
  const migrationDrafts =
    await adapter.listMigrationDrafts();
  const latestMigration =
    migrationDrafts.at(-1);
  const isPrototypeAdapter =
    adapter instanceof
    InMemoryAuthBackendAdapter;
  const isSupabaseAdapter =
    adapter instanceof
    SupabaseAuthBackendAdapter;

  return {
    enabled:
      authFeatureConfig.enabled,
    provider:
      authFeatureConfig.provider,
    sessionStatus:
      session.status,
    adapterType:
      isPrototypeAdapter
        ? "prototype"
        : isSupabaseAdapter
          ? "supabase"
          : "disabled",
    isPrototypeAdapter:
      isPrototypeAdapter,
    isSupabaseAdapter,
    isSupabaseConfigured:
      isSupabaseAdapter &&
      adapter.isConfigured(),
    membershipCount:
      memberships.length,
    invitationCount:
      invitations.length,
    migrationDraftCount:
      migrationDrafts.length,
    latestMigrationStatus:
      latestMigration?.status,
  };
}
