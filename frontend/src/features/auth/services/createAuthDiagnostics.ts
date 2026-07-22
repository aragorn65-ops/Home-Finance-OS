import {
  authFeatureConfig,
} from "../../../config/auth";
import type {
  AuthFeatureConfig,
} from "../../../config/auth";

import type {
  AuthSession,
  AuthDiagnostics,
} from "../models";
import type {
  AuthBackendAdapter,
} from "./AuthBackendAdapter";
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

  return createAuthDiagnosticsForAdapter(
    adapter,
    authFeatureConfig
  );
}

export async function createAuthDiagnosticsForAdapter(
  adapter: AuthBackendAdapter,
  config: AuthFeatureConfig =
    authFeatureConfig
): Promise<AuthDiagnostics> {
  const warnings: string[] = [];
  const session =
    await createOptionalDiagnostic<
      AuthSession
    >(
      warnings,
      "Session diagnostics",
      {
        status:
          "signed-out",
      },
      () =>
        adapter.getSession()
    );
  const memberships =
    await createOptionalDiagnostic(
      warnings,
      "Membership diagnostics",
      [],
      () =>
        adapter.listMemberships()
    );
  const invitations =
    await createOptionalDiagnostic(
      warnings,
      "Invitation diagnostics",
      [],
      () =>
        adapter.listInvitations()
    );
  const migrationDrafts =
    await createOptionalDiagnostic(
      warnings,
      "Migration diagnostics",
      [],
      () =>
        adapter.listMigrationDrafts()
    );
  const latestMigration =
    findLatestMigrationDraft(
      migrationDrafts
    );
  const isPrototypeAdapter =
    adapter instanceof
    InMemoryAuthBackendAdapter;
  const isSupabaseAdapter =
    adapter instanceof
    SupabaseAuthBackendAdapter;
  const householdIds =
    memberships.map(
      (membership) =>
        membership.householdId
    );
  const householdDiagnostics =
    await createOptionalDiagnostic(
      warnings,
      "Household diagnostics",
      [],
      () =>
        isSupabaseAdapter
          ? adapter
            .listHouseholdDiagnostics(
              householdIds
            )
          : Promise.resolve([])
    );
  const householdNameById =
    new Map(
      householdDiagnostics.map(
        (household) => [
          household.householdId,
          household.householdName,
        ]
      )
    );
  const accountSummary =
    await createOptionalDiagnostic(
      warnings,
      "Account diagnostics",
      undefined,
      () =>
        isSupabaseAdapter
          ? adapter
            .createAccountDiagnosticSummary(
              householdIds
            )
          : Promise.resolve(undefined)
    );
  const transactionSummary =
    await createOptionalDiagnostic(
      warnings,
      "Transaction diagnostics",
      undefined,
      () =>
        isSupabaseAdapter
          ? adapter
            .createTransactionDiagnosticSummary(
              householdIds
            )
          : Promise.resolve(undefined)
    );

  return {
    enabled:
      config.enabled,
    provider:
      config.provider,
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
    warnings,
    membershipCount:
      memberships.length,
    memberships:
      memberships.map(
        (membership) => ({
          householdId:
            membership.householdId,
          householdName:
            householdNameById.get(
              membership.householdId
            ),
          memberId:
            membership.memberId,
          role:
            membership.role,
          status:
            membership.status,
        })
      ),
    accountSummary,
    transactionSummary,
    invitationCount:
      invitations.length,
    migrationDraftCount:
      migrationDrafts.length,
    latestMigrationStatus:
      latestMigration?.status,
    latestMigrationAt:
      latestMigration
        ? getMigrationDiagnosticDate(
          latestMigration
        )
        : undefined,
  };
}

export function findLatestMigrationDraft<
  T extends {
    updatedAt: Date;
    validatedAt?: Date;
    committedAt?: Date;
    abortedAt?: Date;
  },
>(drafts: T[]): T | undefined {
  return drafts.reduce<
    T | undefined
  >((latest, draft) => {
    if (!latest) {
      return draft;
    }

    return getMigrationDiagnosticDate(
      draft
    ).getTime() >
      getMigrationDiagnosticDate(
        latest
      ).getTime()
      ? draft
      : latest;
  }, undefined);
}

export function getMigrationDiagnosticDate(
  draft: {
    updatedAt: Date;
    validatedAt?: Date;
    committedAt?: Date;
    abortedAt?: Date;
  }
): Date {
  return draft.abortedAt ??
    draft.committedAt ??
    draft.validatedAt ??
    draft.updatedAt;
}

async function createOptionalDiagnostic<T>(
  warnings: string[],
  label: string,
  fallback: T,
  load: () => Promise<T>
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    warnings.push(
      `${label} could not be loaded: ${getErrorMessage(error)}`
    );

    return fallback;
  }
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : "Unknown error.";
}
