import type {
  AuthBackendAdapter,
  AuthSignInRequest,
  AuthSessionSubscription,
  HouseholdClaimDraft,
  HouseholdClaimResult,
} from "./AuthBackendAdapter";
import type {
  AuthSession,
  AuthUser,
  HouseholdInvitation,
  HouseholdMembership,
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationValidation,
} from "../models";

interface SupabaseAuthClient {
  auth: {
    getSession():
      Promise<SupabaseSessionResult>;
    getUser():
      Promise<SupabaseUserResult>;
    signInWithOtp(
      credentials:
        SupabasePasswordlessCredentials
    ): Promise<SupabaseErrorResult>;
    signOut():
      Promise<SupabaseErrorResult>;
    onAuthStateChange(
      callback:
        SupabaseAuthChangeCallback
    ): {
      data: {
        subscription:
          AuthSessionSubscription;
      };
    };
  };
  from(
    tableName: string
  ): SupabaseQueryBuilder;
  rpc(
    functionName: string,
    parameters: Record<string, unknown>
  ): Promise<
    | SupabaseHouseholdClaimRpcResult
    | SupabaseMigrationValidationRpcResult
    | SupabaseMigrationAbortRpcResult
    | SupabaseMigrationCommitRpcResult
  >;
}

interface SupabaseQueryBuilder {
  select(
    columns: string
  ): SupabaseFilterBuilder;
}

interface SupabaseFilterBuilder {
  eq(
    column: string,
    value: string
  ): Promise<
    | SupabaseMembershipRowsResult
    | SupabaseMigrationDraftRowsResult
  > | SupabaseChainedFilterBuilder;
  in(
    column: string,
    values: string[]
  ): Promise<
    | SupabaseHouseholdRowsResult
    | SupabaseAccountRowsResult
    | SupabaseTransactionRowsResult
  >;
}

interface SupabaseChainedFilterBuilder {
  eq(
    column: string,
    value: string
  ): Promise<SupabaseMigrationDraftRowsResult>;
}

type SupabaseAuthChangeCallback = (
  event: string,
  session:
    | SupabaseSession
    | null
) => void;

interface SupabaseSessionResult {
  data: {
    session:
      | SupabaseSession
      | null;
  };
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseUserResult {
  data: {
    user:
      | SupabaseUser
      | null;
  };
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseErrorResult {
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseMembershipRowsResult {
  data:
    | SupabaseMembershipRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseHouseholdRowsResult {
  data:
    | SupabaseHouseholdRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseAccountRowsResult {
  data:
    | SupabaseAccountRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseTransactionRowsResult {
  data:
    | SupabaseTransactionRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseMigrationDraftRowsResult {
  data:
    | SupabaseMigrationDraftRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseHouseholdClaimRpcResult {
  data:
    | SupabaseHouseholdClaimRpcRow
    | SupabaseHouseholdClaimRpcRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseMigrationValidationRpcResult {
  data:
    | SupabaseMigrationValidationRpcRow
    | SupabaseMigrationValidationRpcRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseMigrationAbortRpcResult {
  data:
    | SupabaseMigrationAbortRpcRow
    | SupabaseMigrationAbortRpcRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseMigrationCommitRpcResult {
  data:
    | SupabaseMigrationCommitRpcRow
    | SupabaseMigrationCommitRpcRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseSession {
  expires_at?: number;
  user: SupabaseUser;
}

interface SupabaseUser {
  id: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

interface SupabaseAuthError {
  message: string;
}

interface SupabasePasswordlessCredentials {
  email: string;
  options?: {
    emailRedirectTo?: string;
    shouldCreateUser?: boolean;
  };
}

interface SupabaseMembershipRow {
  id: string;
  household_id: string;
  user_id: string;
  member_id: string;
  role: string;
  status: string;
  invited_by_user_id?: string | null;
  invited_at?: string | null;
  accepted_at?: string | null;
  removed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface SupabaseHouseholdRow {
  id: string;
  name: string;
  status: string;
}

interface SupabaseAccountRow {
  household_id: string;
  owner_member_id?: string | null;
  account_class: string;
  visibility: string;
  currency: string;
  is_active: boolean;
}

interface SupabaseTransactionRow {
  household_id: string;
  type: string;
  visibility: string;
  transaction_date: string;
  is_active: boolean;
}

interface SupabaseMigrationDraftRow {
  id: string;
  household_id?: string | null;
  owner_user_id: string;
  owner_member_id: string;
  household_name: string;
  status: string;
  validated_at?: string | null;
  committed_at?: string | null;
  aborted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface SupabaseHouseholdClaimRpcRow {
  household_id: string;
  membership_id: string;
  member_id: string;
  user_id: string;
  role: string;
  membership_status: string;
  migration_draft_id: string;
  migration_status: string;
  created_at?: string | null;
  updated_at?: string | null;
}

interface SupabaseMigrationValidationRpcRow {
  draft_id: string;
  status: string;
  validated_at?: string | null;
}

interface SupabaseMigrationAbortRpcRow {
  draft_id: string;
  status: string;
  aborted_at?: string | null;
}

interface SupabaseMigrationCommitRpcRow {
  draft_id: string;
  household_id: string;
  status: string;
  committed_at?: string | null;
}

export interface SupabaseHouseholdDiagnostic {
  householdId: string;
  householdName: string;
  status: string;
}

export interface SupabaseAccountDiagnosticSummary {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  householdVisibleCount: number;
  privateVisibleCount: number;
  assetCount: number;
  liabilityCount: number;
  currencies: string[];
}

export interface SupabaseTransactionDiagnosticSummary {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  incomeCount: number;
  expenseCount: number;
  transferCount: number;
  householdVisibleCount: number;
  participantVisibleCount: number;
  privateVisibleCount: number;
  earliestTransactionDate?: string;
  latestTransactionDate?: string;
}

export interface SupabaseAuthBackendAdapterConfig {
  projectUrl?: string;
  anonKey?: string;
  client?: SupabaseAuthClient;
}

export class SupabaseAuthBackendAdapter
  implements AuthBackendAdapter
{
  private readonly config:
    SupabaseAuthBackendAdapterConfig;

  constructor(
    config:
      SupabaseAuthBackendAdapterConfig =
        createSupabaseAdapterConfig()
  ) {
    this.config = config;
  }

  async getSession():
    Promise<AuthSession> {
    if (!this.isConfigured()) {
      return {
        status: "disabled",
      };
    }

    const client =
      await this.getClient();
    const {
      data,
      error,
    } = await client.auth.getSession();

    if (error) {
      throw new Error(
        `Supabase session lookup failed: ${error.message}`
      );
    }

    if (!data.session) {
      return {
        status: "signed-out",
      };
    }

    return {
      status: "signed-in",
      user:
        mapSupabaseUser(
          data.session.user
        ),
      expiresAt:
        mapSupabaseSessionExpiry(
          data.session
        ),
    };
  }

  async signIn(
    request: AuthSignInRequest = {}
  ):
    Promise<AuthSession> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          "sign-in"
        )
      );
    }

    const email =
      request.email?.trim();

    if (!email) {
      throw new Error(
        "Supabase magic-link sign-in requires an email address."
      );
    }

    const {
      error,
    } = await (
      await this.getClient()
    )
      .auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            request.redirectTo,
          shouldCreateUser:
            false,
        },
      });

    if (error) {
      throw new Error(
        `Supabase magic-link sign-in failed: ${error.message}`
      );
    }

    return this.getSession();
  }

  async signOut():
    Promise<void> {
    if (!this.isConfigured()) {
      return Promise.resolve();
    }

    const {
      error,
    } = await (
      await this.getClient()
    )
      .auth.signOut();

    if (error) {
      throw new Error(
        `Supabase sign-out failed: ${error.message}`
      );
    }
  }

  async getCurrentUser():
    Promise<AuthUser | undefined> {
    if (!this.isConfigured()) {
      return undefined;
    }

    const {
      data,
      error,
    } = await (
      await this.getClient()
    )
      .auth.getUser();

    if (error) {
      throw new Error(
        `Supabase user lookup failed: ${error.message}`
      );
    }

    return data.user
      ? mapSupabaseUser(data.user)
      : undefined;
  }

  async listMemberships():
    Promise<HouseholdMembership[]> {
    const user =
      await this.getCurrentUser();

    if (!user) {
      return [];
    }

    const membershipResult =
      await (
      await this.getClient()
      )
        .from(
          "household_memberships"
        )
        .select(
          [
            "id",
            "household_id",
            "user_id",
            "member_id",
            "role",
            "status",
            "invited_by_user_id",
            "invited_at",
            "accepted_at",
            "removed_at",
            "created_at",
            "updated_at",
          ].join(",")
        )
        .eq(
          "user_id",
          user.id
        ) as SupabaseMembershipRowsResult;
    const {
      data,
      error,
    } = membershipResult;

    if (error) {
      throw new Error(
        `Supabase membership lookup failed: ${error.message}`
      );
    }

    return (data ?? [])
      .map(mapSupabaseMembership)
      .filter(
        (
          membership
        ): membership is HouseholdMembership =>
          Boolean(membership)
      );
  }

  async listInvitations():
    Promise<HouseholdInvitation[]> {
    return [];
  }

  async listHouseholdDiagnostics(
    householdIds: string[]
  ): Promise<SupabaseHouseholdDiagnostic[]> {
    const uniqueHouseholdIds =
      Array.from(
        new Set(
          householdIds.filter(Boolean)
        )
      );

    if (
      uniqueHouseholdIds.length ===
      0
    ) {
      return [];
    }

    const householdResult =
      await (
      await this.getClient()
      )
        .from("households")
        .select("id,name,status")
        .in(
          "id",
          uniqueHouseholdIds
        ) as SupabaseHouseholdRowsResult;
    const {
      data,
      error,
    } = householdResult;

    if (error) {
      throw new Error(
        `Supabase household lookup failed: ${error.message}`
      );
    }

    return (data ?? [])
      .filter(
        (row) =>
          row.status === "active"
      )
      .map((row) => ({
        householdId:
          row.id,
        householdName:
          row.name,
        status:
          row.status,
      }));
  }

  async createAccountDiagnosticSummary(
    householdIds: string[]
  ): Promise<SupabaseAccountDiagnosticSummary> {
    const uniqueHouseholdIds =
      Array.from(
        new Set(
          householdIds.filter(Boolean)
        )
      );

    if (
      uniqueHouseholdIds.length ===
      0
    ) {
      return createEmptyAccountDiagnosticSummary();
    }

    const accountResult =
      await (
      await this.getClient()
      )
        .from("accounts")
        .select(
          [
            "household_id",
            "owner_member_id",
            "account_class",
            "visibility",
            "currency",
            "is_active",
          ].join(",")
        )
        .in(
          "household_id",
          uniqueHouseholdIds
        ) as SupabaseAccountRowsResult;
    const {
      data,
      error,
    } = accountResult;

    if (error) {
      throw new Error(
        `Supabase account diagnostics failed: ${error.message}`
      );
    }

    return summarizeSupabaseAccountRows(
      data ?? []
    );
  }

  async createTransactionDiagnosticSummary(
    householdIds: string[]
  ): Promise<SupabaseTransactionDiagnosticSummary> {
    const uniqueHouseholdIds =
      Array.from(
        new Set(
          householdIds.filter(Boolean)
        )
      );

    if (
      uniqueHouseholdIds.length ===
      0
    ) {
      return createEmptyTransactionDiagnosticSummary();
    }

    const transactionResult =
      await (
      await this.getClient()
      )
        .from("transactions")
        .select(
          [
            "household_id",
            "type",
            "visibility",
            "transaction_date",
            "is_active",
          ].join(",")
        )
        .in(
          "household_id",
          uniqueHouseholdIds
        ) as SupabaseTransactionRowsResult;
    const {
      data,
      error,
    } = transactionResult;

    if (error) {
      throw new Error(
        `Supabase transaction diagnostics failed: ${error.message}`
      );
    }

    return summarizeSupabaseTransactionRows(
      data ?? []
    );
  }

  async createHouseholdClaimDraft(
    draft: HouseholdClaimDraft
  ): Promise<HouseholdClaimResult> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `household claim for ${draft.householdName}`
        )
      );
    }

    const {
      data,
      error,
    } = await (
      await this.getClient()
    )
      .rpc(
        "claim_household_from_backup",
        {
          draft_household_name:
            draft.householdName,
          draft_country:
            "PH",
          draft_currency:
            "PHP",
          draft_timezone:
            Intl.DateTimeFormat()
              .resolvedOptions()
              .timeZone,
          draft_backup_summary:
            draft.backupSummary,
        }
      ) as SupabaseHouseholdClaimRpcResult;

    if (error) {
      throw new Error(
        `Supabase household claim failed: ${error.message}`
      );
    }

    const row =
      Array.isArray(data)
        ? data[0]
        : data;

    if (!row) {
      throw new Error(
        "Supabase household claim returned no result."
      );
    }

    const membership =
      mapSupabaseClaimMembership(row);

    if (!membership) {
      throw new Error(
        "Supabase household claim returned an invalid membership."
      );
    }

    return {
      householdId:
        row.household_id,
      membership,
      migrationDraft:
        mapSupabaseClaimMigrationDraft(
          row,
          draft
        ),
    };
  }

  async listMigrationDrafts():
    Promise<RemoteMigrationDraft[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      return [];
    }

    const migrationResult =
      await (
      await this.getClient()
      )
        .from("migration_drafts")
        .select(
          [
            "id",
            "household_id",
            "owner_user_id",
            "owner_member_id",
            "household_name",
            "status",
            "validated_at",
            "committed_at",
            "aborted_at",
            "created_at",
            "updated_at",
          ].join(",")
        )
        .eq(
          "owner_user_id",
          user.id
        ) as SupabaseMigrationDraftRowsResult;
    const {
      data,
      error,
    } = migrationResult;

    if (error) {
      throw new Error(
        `Supabase migration draft lookup failed: ${error.message}`
      );
    }

    return (data ?? [])
      .map(mapSupabaseMigrationDraft)
      .filter(
        (
          draft
        ): draft is RemoteMigrationDraft =>
          Boolean(draft)
      );
  }

  async validateMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationValidation> {
    if (!this.isConfigured()) {
      return createBlockedMigrationValidation(
        draftId,
        this.createUnavailableMessage(
          "migration validation"
        )
      );
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      return createBlockedMigrationValidation(
        draftId,
        "Sign in before validating a migration draft."
      );
    }

    const migrationFilter =
      (
      await this.getClient()
      )
        .from("migration_drafts")
        .select(
          [
            "id",
            "household_id",
            "owner_user_id",
            "owner_member_id",
            "household_name",
            "status",
            "validated_at",
            "committed_at",
            "aborted_at",
            "created_at",
            "updated_at",
          ].join(",")
        )
        .eq(
          "id",
          draftId
        ) as SupabaseChainedFilterBuilder;
    const migrationResult =
      await migrationFilter
        .eq(
          "owner_user_id",
          user.id
        );
    const {
      data,
      error,
    } = migrationResult;

    if (error) {
      throw new Error(
        `Supabase migration validation failed: ${error.message}`
      );
    }

    const draft =
      (data ?? [])[0];

    if (!draft) {
      return createBlockedMigrationValidation(
        draftId,
        "Migration draft was not found for the current user."
      );
    }

    const blockers =
      createSupabaseMigrationValidationBlockers(
        draft
      );

    if (blockers.length > 0) {
      return {
        draftId,
        isValid:
          false,
        recordCountsMatch:
          false,
        warnings: [
          "Supabase migration validation is metadata-only in this spike.",
        ],
        blockers,
      };
    }

    const validationResult =
      await (
      await this.getClient()
      )
        .rpc(
          "validate_migration_draft_metadata",
          {
            target_draft_id:
              draftId,
          }
        ) as SupabaseMigrationValidationRpcResult;

    if (validationResult.error) {
      throw new Error(
        `Supabase migration validation update failed: ${validationResult.error.message}`
      );
    }

    const validationRow =
      readSingleSupabaseRpcRow(
        validationResult.data
      );

    if (
      !validationRow ||
      validationRow.draft_id !== draftId ||
      validationRow.status !== "validated"
    ) {
      throw new Error(
        "Supabase migration validation returned an invalid result."
      );
    }

    return {
      draftId,
      isValid: true,
      recordCountsMatch: true,
      warnings: [
        "Supabase migration validation is metadata-only in this spike.",
      ],
      blockers: [],
    };
  }

  async commitMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `migration commit for ${draftId}`
        )
      );
    }

    const commitResult =
      await (
      await this.getClient()
      )
        .rpc(
          "commit_migration_draft",
          {
            target_draft_id:
              draftId,
          }
        ) as SupabaseMigrationCommitRpcResult;

    if (commitResult.error) {
      throw new Error(
        `Supabase migration commit failed: ${commitResult.error.message}`
      );
    }

    const row =
      Array.isArray(commitResult.data)
        ? commitResult.data[0]
        : commitResult.data;

    if (!row) {
      throw new Error(
        "Supabase migration commit returned no result."
      );
    }

    if (
      row.draft_id !== draftId ||
      row.status !== "committed" ||
      !row.household_id
    ) {
      throw new Error(
        "Supabase migration commit returned an invalid result."
      );
    }

    return {
      householdId:
        row.household_id,
      migrationId:
        row.draft_id,
      committedAt:
        mapSupabaseDate(
          row.committed_at ??
            undefined
        ),
    };
  }

  async abortMigrationDraft(
    draftId: string
  ):
    Promise<void> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `migration abort for ${draftId}`
        )
      );
    }

    const abortResult =
      await (
      await this.getClient()
      )
        .rpc(
          "abort_migration_draft",
          {
            target_draft_id:
              draftId,
          }
        ) as SupabaseMigrationAbortRpcResult;

    if (abortResult.error) {
      throw new Error(
        `Supabase migration abort failed: ${abortResult.error.message}`
      );
    }

    const abortRow =
      readSingleSupabaseRpcRow(
        abortResult.data
      );

    if (
      !abortRow ||
      abortRow.draft_id !== draftId ||
      abortRow.status !== "aborted"
    ) {
      throw new Error(
        "Supabase migration abort returned an invalid result."
      );
    }
  }

  subscribeToSessionChanges(
    onChange: () => void
  ): AuthSessionSubscription {
    if (!this.isConfigured()) {
      return {
        unsubscribe() {
          return undefined;
        },
      };
    }

    let isDisposed = false;
    const subscriptionPromise =
      this.getClient()
        .then((client) =>
          client.auth
            .onAuthStateChange(
              () => {
                if (!isDisposed) {
                  onChange();
                }
              }
            )
            .data.subscription
        );

    return {
      unsubscribe() {
        isDisposed = true;
        void subscriptionPromise
          .then((subscription) => {
            subscription.unsubscribe();
          });
      },
    };
  }

  isConfigured():
    boolean {
    return Boolean(
      this.config.projectUrl &&
        this.config.anonKey
    );
  }

  private createUnavailableMessage(
    action: string
  ): string {
    if (!this.isConfigured()) {
      return (
        "Supabase auth spike is missing " +
        "VITE_SUPABASE_URL or " +
        "VITE_SUPABASE_ANON_KEY."
      );
    }

    return (
      `Supabase ${action} is not wired yet. ` +
      "Run the disposable-project spike before " +
      "enabling production beta auth."
    );
  }

  private async getClient():
    Promise<SupabaseAuthClient> {
    if (this.config.client) {
      return this.config.client;
    }

    if (
      !this.config.projectUrl ||
      !this.config.anonKey
    ) {
      throw new Error(
        this.createUnavailableMessage(
          "client creation"
        )
      );
    }

    const {
      createClient,
    } = await import(
      "@supabase/supabase-js"
    );

    this.config.client =
      createClient(
        this.config.projectUrl,
        this.config.anonKey
      ) as unknown as SupabaseAuthClient;

    return this.config.client;
  }
}

function mapSupabaseUser(
  user: SupabaseUser
): AuthUser {
  return {
    id:
      user.id,
    email:
      user.email ??
      "unknown@supabase.local",
    displayName:
      user.user_metadata
        ?.display_name ??
      user.user_metadata
        ?.full_name ??
      user.user_metadata
        ?.name,
    avatarUrl:
      user.user_metadata
        ?.avatar_url,
    createdAt:
      mapSupabaseDate(
        user.created_at
      ),
    updatedAt:
      mapSupabaseDate(
        user.updated_at ??
          user.created_at
      ),
  };
}

function mapSupabaseSessionExpiry(
  session: SupabaseSession
): Date | undefined {
  if (!session.expires_at) {
    return undefined;
  }

  return new Date(
    session.expires_at * 1000
  );
}

function mapSupabaseDate(
  value: string | undefined
): Date {
  return value
    ? new Date(value)
    : new Date(0);
}

function mapSupabaseMembership(
  row: SupabaseMembershipRow
): HouseholdMembership | undefined {
  const role =
    normalizeMembershipRole(
      row.role
    );
  const status =
    normalizeMembershipStatus(
      row.status
    );

  if (!role || !status) {
    return undefined;
  }

  return {
    id:
      row.id,
    householdId:
      row.household_id,
    userId:
      row.user_id,
    memberId:
      row.member_id,
    role,
    status,
    invitedByUserId:
      row.invited_by_user_id ??
      undefined,
    invitedAt:
      mapOptionalSupabaseDate(
        row.invited_at
      ),
    acceptedAt:
      mapOptionalSupabaseDate(
        row.accepted_at
      ),
    removedAt:
      mapOptionalSupabaseDate(
        row.removed_at
      ),
    createdAt:
      mapSupabaseDate(
        row.created_at ??
          undefined
      ),
    updatedAt:
      mapSupabaseDate(
        row.updated_at ??
          row.created_at ??
          undefined
      ),
  };
}

function normalizeMembershipRole(
  value: string
): HouseholdMembership["role"] | undefined {
  if (
    value === "owner" ||
    value === "admin" ||
    value === "member" ||
    value === "viewer"
  ) {
    return value;
  }

  return undefined;
}

function normalizeMembershipStatus(
  value: string
): HouseholdMembership["status"] | undefined {
  if (
    value === "active" ||
    value === "invited" ||
    value === "declined" ||
    value === "removed"
  ) {
    return value;
  }

  return undefined;
}

function mapSupabaseMigrationDraft(
  row: SupabaseMigrationDraftRow
): RemoteMigrationDraft | undefined {
  const status =
    normalizeMigrationStatus(
      row.status
    );

  if (!status) {
    return undefined;
  }

  return {
    id:
      row.id,
    householdId:
      row.household_id ??
      "",
    householdName:
      row.household_name,
    ownerMemberId:
      row.owner_member_id,
    requestedByUserId:
      row.owner_user_id,
    backupSummary:
      createRedactedMigrationBackupSummary(
        row
      ),
    remoteRecordCount:
      0,
    status,
    createdAt:
      mapSupabaseDate(
        row.created_at ??
          undefined
      ),
    updatedAt:
      mapSupabaseDate(
        row.updated_at ??
          row.created_at ??
          undefined
      ),
    validatedAt:
      mapOptionalSupabaseDate(
        row.validated_at
      ),
    committedAt:
      mapOptionalSupabaseDate(
        row.committed_at
      ),
    abortedAt:
      mapOptionalSupabaseDate(
        row.aborted_at
      ),
  };
}

function normalizeMigrationStatus(
  value: string
): RemoteMigrationDraft["status"] | undefined {
  if (
    value === "draft" ||
    value === "uploaded" ||
    value === "validated" ||
    value === "committed" ||
    value === "aborted"
  ) {
    return value;
  }

  return undefined;
}

function createRedactedMigrationBackupSummary(
  row: SupabaseMigrationDraftRow
): RemoteMigrationDraft["backupSummary"] {
  return {
    householdName:
      row.household_name,
    remoteHouseholdId:
      row.household_id ??
      undefined,
    authenticatedLinkStatus:
      row.household_id
        ? "linked"
        : "unlinked",
    exportedAt:
      row.created_at ??
      new Date(0).toISOString(),
    accountCount:
      0,
    transactionCount:
      0,
    expenseAllocationCount:
      0,
    settlementCount:
      0,
    settlementApplicationCount:
      0,
    savingsGoalCount:
      0,
    savingsActivityCount:
      0,
    providerBillCount:
      0,
  };
}

function mapSupabaseClaimMembership(
  row: SupabaseHouseholdClaimRpcRow
): HouseholdMembership | undefined {
  const role =
    normalizeMembershipRole(
      row.role
    );
  const status =
    normalizeMembershipStatus(
      row.membership_status
    );

  if (!role || !status) {
    return undefined;
  }

  return {
    id:
      row.membership_id,
    householdId:
      row.household_id,
    userId:
      row.user_id,
    memberId:
      row.member_id,
    role,
    status,
    acceptedAt:
      mapSupabaseDate(
        row.created_at ??
          undefined
      ),
    createdAt:
      mapSupabaseDate(
        row.created_at ??
          undefined
      ),
    updatedAt:
      mapSupabaseDate(
        row.updated_at ??
          row.created_at ??
          undefined
      ),
  };
}

function mapSupabaseClaimMigrationDraft(
  row: SupabaseHouseholdClaimRpcRow,
  draft: HouseholdClaimDraft
): RemoteMigrationDraft {
  return {
    id:
      row.migration_draft_id,
    householdId:
      row.household_id,
    householdName:
      draft.householdName,
    ownerMemberId:
      row.member_id,
    requestedByUserId:
      row.user_id,
    backupSummary:
      draft.backupSummary,
    remoteRecordCount:
      countRemoteMigrationRecords(
        draft.backupSummary
      ),
    status:
      normalizeMigrationStatus(
        row.migration_status
      ) ?? "uploaded",
    createdAt:
      mapSupabaseDate(
        row.created_at ??
          undefined
      ),
    updatedAt:
      mapSupabaseDate(
        row.updated_at ??
          row.created_at ??
          undefined
      ),
  };
}

function createBlockedMigrationValidation(
  draftId: string,
  blocker: string
): RemoteMigrationValidation {
  return {
    draftId,
    isValid:
      false,
    recordCountsMatch:
      false,
    warnings: [],
    blockers: [
      blocker,
    ],
  };
}

function createSupabaseMigrationValidationBlockers(
  draft: SupabaseMigrationDraftRow
): string[] {
  const blockers: string[] = [];

  if (!draft.household_id) {
    blockers.push(
      "Migration draft is missing a linked household."
    );
  }

  if (!draft.owner_member_id) {
    blockers.push(
      "Migration draft is missing an owner member."
    );
  }

  if (
    !normalizeMigrationStatus(
      draft.status
    )
  ) {
    blockers.push(
      "Migration draft has an unknown status."
    );
  }

  if (
    draft.status === "aborted"
  ) {
    blockers.push(
      "Migration draft has already been aborted."
    );
  }

  if (
    draft.status === "committed"
  ) {
    blockers.push(
      "Migration draft has already been committed."
    );
  }

  return blockers;
}

function readSingleSupabaseRpcRow<T>(
  data:
    | T
    | T[]
    | null
): T | undefined {
  return Array.isArray(data)
    ? data[0]
    : data ??
      undefined;
}

function countRemoteMigrationRecords(
  summary: HouseholdClaimDraft["backupSummary"]
): number {
  const counts: number[] = [
    summary.accountCount ?? 0,
    summary.transactionCount ?? 0,
    summary.expenseAllocationCount ?? 0,
    summary.settlementCount ?? 0,
    summary.settlementApplicationCount ?? 0,
    summary.savingsGoalCount ?? 0,
    summary.savingsActivityCount ?? 0,
    summary.providerBillCount ?? 0,
  ];

  return counts.reduce(
    (total, count) =>
      total + count,
    1
  );
}

function mapOptionalSupabaseDate(
  value:
    | string
    | null
    | undefined
): Date | undefined {
  return value
    ? new Date(value)
    : undefined;
}

function createEmptyAccountDiagnosticSummary():
  SupabaseAccountDiagnosticSummary {
  return {
    totalCount:
      0,
    activeCount:
      0,
    inactiveCount:
      0,
    householdVisibleCount:
      0,
    privateVisibleCount:
      0,
    assetCount:
      0,
    liabilityCount:
      0,
    currencies: [],
  };
}

function summarizeSupabaseAccountRows(
  rows: SupabaseAccountRow[]
): SupabaseAccountDiagnosticSummary {
  const summary =
    createEmptyAccountDiagnosticSummary();
  const currencies =
    new Set<string>();

  rows.forEach((row) => {
    summary.totalCount += 1;

    if (row.is_active) {
      summary.activeCount += 1;
    } else {
      summary.inactiveCount += 1;
    }

    if (
      row.visibility ===
      "private"
    ) {
      summary.privateVisibleCount += 1;
    } else if (
      row.visibility ===
      "household"
    ) {
      summary.householdVisibleCount += 1;
    }

    if (
      row.account_class ===
      "asset"
    ) {
      summary.assetCount += 1;
    } else if (
      row.account_class ===
      "liability"
    ) {
      summary.liabilityCount += 1;
    }

    if (row.currency) {
      currencies.add(row.currency);
    }
  });

  summary.currencies =
    Array.from(currencies)
      .sort();

  return summary;
}

function createEmptyTransactionDiagnosticSummary():
  SupabaseTransactionDiagnosticSummary {
  return {
    totalCount:
      0,
    activeCount:
      0,
    inactiveCount:
      0,
    incomeCount:
      0,
    expenseCount:
      0,
    transferCount:
      0,
    householdVisibleCount:
      0,
    participantVisibleCount:
      0,
    privateVisibleCount:
      0,
  };
}

function summarizeSupabaseTransactionRows(
  rows: SupabaseTransactionRow[]
): SupabaseTransactionDiagnosticSummary {
  const summary =
    createEmptyTransactionDiagnosticSummary();

  rows.forEach((row) => {
    summary.totalCount += 1;

    if (row.is_active) {
      summary.activeCount += 1;
    } else {
      summary.inactiveCount += 1;
    }

    if (row.type === "income") {
      summary.incomeCount += 1;
    } else if (row.type === "expense") {
      summary.expenseCount += 1;
    } else if (row.type === "transfer") {
      summary.transferCount += 1;
    }

    if (row.visibility === "private") {
      summary.privateVisibleCount += 1;
    } else if (
      row.visibility === "participants"
    ) {
      summary.participantVisibleCount += 1;
    } else if (
      row.visibility === "household"
    ) {
      summary.householdVisibleCount += 1;
    }

    if (!row.transaction_date) {
      return;
    }

    if (
      !summary.earliestTransactionDate ||
      row.transaction_date <
        summary.earliestTransactionDate
    ) {
      summary.earliestTransactionDate =
        row.transaction_date;
    }

    if (
      !summary.latestTransactionDate ||
      row.transaction_date >
        summary.latestTransactionDate
    ) {
      summary.latestTransactionDate =
        row.transaction_date;
    }
  });

  return summary;
}

function createSupabaseAdapterConfig():
  SupabaseAuthBackendAdapterConfig {
  const viteEnv =
    import.meta.env as
      | Record<string, string | undefined>
      | undefined;

  return {
    projectUrl:
      viteEnv?.VITE_SUPABASE_URL,
    anonKey:
      viteEnv?.VITE_SUPABASE_ANON_KEY,
  };
}
