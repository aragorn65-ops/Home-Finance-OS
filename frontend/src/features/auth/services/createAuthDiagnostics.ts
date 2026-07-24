import {
  authFeatureConfig,
} from "../../../config/auth";
import type {
  AuthFeatureConfig,
} from "../../../config/auth";

import type {
  AuthSession,
  AuthDiagnostics,
  AuthAccountDiagnosticSummary,
  AuthCloudRestorePreview,
  AuthPostCommitSmokeCheck,
  AuthProductionReadinessCheck,
  AuthTransactionDiagnosticSummary,
  RemoteMigrationDraft,
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
  const hasSignedInSession =
    session.status === "signed-in";
  const memberships =
    hasSignedInSession
      ? await createOptionalDiagnostic(
        warnings,
        "Membership diagnostics",
        [],
        () =>
          adapter.listMemberships()
      )
      : [];
  const invitations =
    hasSignedInSession
      ? await createOptionalDiagnostic(
        warnings,
        "Invitation diagnostics",
        [],
        () =>
          adapter.listInvitations()
      )
      : [];
  const migrationDrafts =
    hasSignedInSession
      ? await createOptionalDiagnostic(
        warnings,
        "Migration diagnostics",
        [],
        () =>
          adapter.listMigrationDrafts()
      )
      : [];
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
  const schemaReadinessChecks =
    await createOptionalDiagnostic(
      warnings,
      "Schema readiness diagnostics",
      [],
      () =>
        isSupabaseAdapter
          ? adapter
            .listSchemaReadinessChecks()
          : Promise.resolve([])
    );
  const productionReadinessChecks =
    createProductionAuthReadinessChecks({
      config,
      sessionStatus:
        session.status,
      isSupabaseAdapter,
      isSupabaseConfigured:
        isSupabaseAdapter &&
        adapter.isConfigured(),
      membershipCount:
        memberships.length,
      warningCount:
        warnings.length,
    });
  const postCommitSmokeChecks =
    createPostCommitSmokeChecks({
      latestMigration,
      householdDiagnostics:
        householdDiagnostics.map(
          (household) => ({
            householdId:
              household.householdId,
            householdName:
              household.householdName,
          })
        ),
      accountSummary,
      transactionSummary,
    });
  const cloudRestorePreview =
    createCloudRestorePreview({
      latestMigration,
      householdDiagnostics:
        householdDiagnostics.map(
          (household) => ({
            householdId:
              household.householdId,
            householdName:
              household.householdName,
          })
        ),
      accountSummary,
      transactionSummary,
    });

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
    schemaReadinessChecks:
      schemaReadinessChecks.map(
        (check) => ({
          id:
            check.id,
          label:
            check.label,
          status:
            check.ready
              ? "pass"
              : "blocked",
          detail:
            check.detail,
        })
      ),
    productionReadinessChecks,
    postCommitSmokeChecks,
    cloudRestorePreview,
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

export function createCloudRestorePreview({
  latestMigration,
  householdDiagnostics,
  accountSummary,
  transactionSummary,
}: {
  latestMigration:
    | RemoteMigrationDraft
    | undefined;
  householdDiagnostics: Array<{
    householdId: string;
    householdName?: string;
  }>;
  accountSummary:
    | AuthAccountDiagnosticSummary
    | undefined;
  transactionSummary:
    | AuthTransactionDiagnosticSummary
    | undefined;
}): AuthCloudRestorePreview | undefined {
  if (!latestMigration) {
    return undefined;
  }

  const householdName =
    latestMigration.householdName ??
    latestMigration.backupSummary
      .householdName ??
    "Remote household";
  const expectedAccountCount =
    latestMigration.backupSummary
      .accountCount ?? 0;
  const expectedTransactionCount =
    latestMigration.backupSummary
      .transactionCount ?? 0;
  const readableAccountCount =
    accountSummary?.totalCount ?? 0;
  const readableTransactionCount =
    transactionSummary?.totalCount ?? 0;
  const remoteHousehold =
    householdDiagnostics.find(
      (household) =>
        household.householdId ===
        latestMigration.householdId
    );
  const dateRange =
    transactionSummary?.earliestTransactionDate &&
    transactionSummary?.latestTransactionDate
      ? `${transactionSummary.earliestTransactionDate} to ${transactionSummary.latestTransactionDate}`
      : undefined;

  if (latestMigration.status !== "committed") {
    return {
      householdName,
      householdId:
        latestMigration.householdId,
      expectedAccountCount,
      readableAccountCount,
      expectedTransactionCount,
      readableTransactionCount,
      currencies:
        accountSummary?.currencies ?? [],
      dateRange,
      checks: [
        {
          id: "restore-source",
          label: "Restore source",
          status: "action",
          detail:
            "Commit a migration checkpoint before previewing cloud restore data.",
        },
      ],
    };
  }

  return {
    householdName,
    householdId:
      latestMigration.householdId,
    expectedAccountCount,
    readableAccountCount,
    expectedTransactionCount,
    readableTransactionCount,
    currencies:
      accountSummary?.currencies ?? [],
    dateRange,
    checks: [
      {
        id: "restore-source",
        label: "Restore source",
        status: "pass",
        detail:
          `${householdName} has a committed cloud checkpoint available for preview.`,
      },
      {
        id: "household-preview",
        label: "Household preview",
        status:
          remoteHousehold
            ? "pass"
            : "blocked",
        detail:
          remoteHousehold
            ? `${remoteHousehold.householdName ?? householdName} is readable without local writes.`
            : "The committed household is not readable from this session.",
      },
      {
        id: "account-preview",
        label: "Account preview",
        status:
          readableAccountCount ===
            expectedAccountCount
            ? "pass"
            : "blocked",
        detail:
          accountSummary
            ? `${readableAccountCount} of ${expectedAccountCount} accounts are visible for restore preview.`
            : "Remote account preview data is not available.",
      },
      {
        id: "transaction-preview",
        label: "Transaction preview",
        status:
          readableTransactionCount ===
            expectedTransactionCount
            ? "pass"
            : "blocked",
        detail:
          transactionSummary
            ? `${readableTransactionCount} of ${expectedTransactionCount} transactions are visible for restore preview.`
            : "Remote transaction preview data is not available.",
      },
      {
        id: "link-preview",
        label: "Transaction link preview",
        status:
          transactionSummary &&
          transactionSummary
            .missingAccountLinkCount === 0 &&
          transactionSummary
            .expenseMissingSourceAccountCount === 0
            ? "pass"
            : "blocked",
        detail:
          transactionSummary
            ? `${transactionSummary.missingAccountLinkCount} transactions lack account links; ${transactionSummary.expenseMissingSourceAccountCount} expenses lack source accounts.`
            : "Remote transaction link preview data is not available.",
      },
      {
        id: "restore-boundary",
        label: "Restore boundary",
        status: "pass",
        detail:
          "This is a read-only preview; browser restore, remote CRUD, and automatic sync remain disabled.",
      },
    ],
  };
}

export function createPostCommitSmokeChecks({
  latestMigration,
  householdDiagnostics,
  accountSummary,
  transactionSummary,
}: {
  latestMigration:
    | RemoteMigrationDraft
    | undefined;
  householdDiagnostics: Array<{
    householdId: string;
    householdName?: string;
  }>;
  accountSummary:
    | AuthAccountDiagnosticSummary
    | undefined;
  transactionSummary:
    | AuthTransactionDiagnosticSummary
    | undefined;
}): AuthPostCommitSmokeCheck[] {
  if (!latestMigration) {
    return [];
  }

  if (latestMigration.status !== "committed") {
    return [
      {
        id: "committed-checkpoint",
        label: "Committed checkpoint",
        status: "action",
        detail:
          "Commit the latest migration checkpoint before remote readback checks.",
      },
    ];
  }

  const expectedAccountCount =
    latestMigration.backupSummary
      .accountCount ?? 0;
  const expectedTransactionCount =
    latestMigration.backupSummary
      .transactionCount ?? 0;
  const remoteHousehold =
    householdDiagnostics.find(
      (household) =>
        household.householdId ===
        latestMigration.householdId
    );

  return [
    {
      id: "committed-checkpoint",
      label: "Committed checkpoint",
      status: "pass",
      detail:
        "The latest migration checkpoint is committed.",
    },
    {
      id: "remote-household-read",
      label: "Remote household read",
      status:
        remoteHousehold
          ? "pass"
          : "blocked",
      detail:
        remoteHousehold
          ? `${remoteHousehold.householdName ?? latestMigration.householdName} is readable.`
          : "The committed remote household could not be read.",
    },
    {
      id: "remote-account-count",
      label: "Remote account count",
      status:
        accountSummary?.totalCount ===
          expectedAccountCount
          ? "pass"
          : "blocked",
      detail:
        accountSummary
          ? `${accountSummary.totalCount} of ${expectedAccountCount} committed accounts are readable.`
          : "Remote account diagnostics are not available.",
    },
    {
      id: "remote-transaction-count",
      label: "Remote transaction count",
      status:
        transactionSummary?.totalCount ===
          expectedTransactionCount
          ? "pass"
          : "blocked",
      detail:
        transactionSummary
          ? `${transactionSummary.totalCount} of ${expectedTransactionCount} committed transactions are readable.`
          : "Remote transaction diagnostics are not available.",
    },
    {
      id: "remote-transaction-links",
      label: "Remote transaction links",
      status:
        transactionSummary &&
        transactionSummary
          .missingAccountLinkCount === 0 &&
        transactionSummary
          .expenseMissingSourceAccountCount === 0
          ? "pass"
          : "blocked",
      detail:
        transactionSummary
          ? `${transactionSummary.missingAccountLinkCount} transactions without account links; ${transactionSummary.expenseMissingSourceAccountCount} expenses without source accounts.`
          : "Remote transaction link diagnostics are not available.",
    },
    {
      id: "sync-boundary",
      label: "Sync boundary",
      status: "pass",
      detail:
        "Readback checks are read-only; remote CRUD and automatic sync remain disabled.",
    },
  ];
}

export function createProductionAuthReadinessChecks({
  config,
  sessionStatus,
  isSupabaseAdapter,
  isSupabaseConfigured,
  membershipCount,
  warningCount,
}: {
  config: AuthFeatureConfig;
  sessionStatus: AuthSession["status"];
  isSupabaseAdapter: boolean;
  isSupabaseConfigured: boolean;
  membershipCount: number;
  warningCount: number;
}): AuthProductionReadinessCheck[] {
  return [
    {
      id: "provider",
      label: "Production provider",
      status:
        config.enabled &&
        config.provider === "supabase" &&
        isSupabaseAdapter
          ? "pass"
          : "action",
      detail:
        config.enabled &&
        config.provider === "supabase" &&
        isSupabaseAdapter
          ? "Supabase auth adapter is selected for this build."
          : "Enable auth with VITE_HFOS_AUTH_PROVIDER=supabase before production auth testing.",
    },
    {
      id: "env",
      label: "Supabase environment",
      status:
        isSupabaseConfigured
          ? "pass"
          : "blocked",
      detail:
        isSupabaseConfigured
          ? "Supabase URL and anon key are present in this build."
          : "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloudflare Pages.",
    },
    {
      id: "session",
      label: "Magic-link session",
      status:
        sessionStatus === "signed-in"
          ? "pass"
          : "action",
      detail:
        sessionStatus === "signed-in"
          ? "A signed-in session is available in this browser."
          : "Send and open a Supabase magic link from the production URL.",
    },
    {
      id: "membership",
      label: "Household membership",
      status:
        membershipCount > 0
          ? "pass"
          : "action",
      detail:
        membershipCount > 0
          ? "The signed-in user has at least one household membership."
          : "Claim or invite a household after sign-in before testing migration.",
    },
    {
      id: "diagnostics",
      label: "Remote diagnostics",
      status:
        warningCount === 0
          ? "pass"
          : "blocked",
      detail:
        warningCount === 0
          ? "Auth diagnostics completed without remote read warnings."
          : "Resolve auth diagnostic warnings before enabling migration or sync.",
    },
    {
      id: "sync-boundary",
      label: "Sync boundary",
      status: "pass",
      detail:
        "Remote CRUD and automatic multi-device sync remain disabled for this sprint.",
    },
  ];
}

export function findLatestMigrationDraft<
  T extends {
    updatedAt: Date;
    validatedAt?: Date;
    uploadStagedAt?: Date;
    accountUploadStagedAt?: Date;
    transactionUploadStagedAt?: Date;
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
    uploadStagedAt?: Date;
    accountUploadStagedAt?: Date;
    transactionUploadStagedAt?: Date;
    committedAt?: Date;
    abortedAt?: Date;
  }
): Date {
  return draft.abortedAt ??
    draft.committedAt ??
    draft.transactionUploadStagedAt ??
    draft.accountUploadStagedAt ??
    draft.uploadStagedAt ??
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
