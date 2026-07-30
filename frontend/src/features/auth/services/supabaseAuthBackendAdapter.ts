import type {
  AuthBackendAdapter,
  AuthSignInRequest,
  AuthSessionSubscription,
  HouseholdClaimDraft,
  HouseholdClaimResult,
  RemoteHouseholdPreferencesInput,
} from "./AuthBackendAdapter";
import type {
  AuthSession,
  AuthUser,
  HouseholdInvitation,
  HouseholdMembership,
  RemoteHousehold,
  RemoteHouseholdCoreSnapshot,
  RemoteHouseholdCoreSnapshotInput,
  RemoteMigrationAccountUploadRecord,
  RemoteMigrationAccountUploadPayload,
  RemoteMigrationAccountUploadStagingResult,
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationPreCommitAudit,
  RemoteMigrationTransactionUploadRecord,
  RemoteMigrationTransactionUploadPayload,
  RemoteMigrationTransactionUploadStagingResult,
  RemoteMigrationUploadManifest,
  RemoteMigrationUploadStagingResult,
  RemoteMigrationValidation,
  RemoteSettlement,
  RemoteSettlementApplication,
  RemoteSettlementCreateInput,
  RemoteSettlementMutationResult,
  RemoteSettlementUpdateInput,
} from "../models";
import type {
  StoredAttachment,
  StoredAttachmentCategory,
} from "../../../shared/models/StoredAttachment";

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
    | SupabaseMigrationUploadStagingRpcResult
    | SupabaseMigrationAccountUploadStagingRpcResult
    | SupabaseMigrationTransactionUploadStagingRpcResult
    | SupabaseMigrationPreCommitAuditRpcResult
    | SupabaseMigrationAbortRpcResult
    | SupabaseMigrationCommitRpcResult
    | SupabaseRemoteHouseholdRpcResult
    | SupabaseCoreSnapshotRpcResult
    | SupabaseSettlementMutationRpcResult
      | SupabaseSettlementDeleteRpcResult
  >;
  channel?(
    topic: string
  ): SupabaseRealtimeChannel;
  removeChannel?(
    channel: SupabaseRealtimeChannel
  ): Promise<unknown>;
}

interface SupabaseRealtimeChannel {
  on(
    type: string,
    filter:
      Record<string, unknown>,
    callback: () => void
  ): SupabaseRealtimeChannel;
  subscribe(): SupabaseRealtimeChannel;
  unsubscribe?(): Promise<unknown> | unknown;
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
    | SupabaseSettlementRowsResult
    | SupabaseSettlementApplicationRowsResult
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

interface SupabaseSettlementRowsResult {
  data:
    | SupabaseSettlementRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseSettlementApplicationRowsResult {
  data:
    | SupabaseSettlementApplicationRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseSchemaProbeRowsResult {
  data:
    | Array<{
        id: string;
      }>
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

interface SupabaseMigrationUploadStagingRpcResult {
  data:
    | SupabaseMigrationUploadStagingRpcRow
    | SupabaseMigrationUploadStagingRpcRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseMigrationAccountUploadStagingRpcResult {
  data:
    | SupabaseMigrationAccountUploadStagingRpcRow
    | SupabaseMigrationAccountUploadStagingRpcRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseMigrationTransactionUploadStagingRpcResult {
  data:
    | SupabaseMigrationTransactionUploadStagingRpcRow
    | SupabaseMigrationTransactionUploadStagingRpcRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseMigrationPreCommitAuditRpcResult {
  data:
    | SupabaseMigrationPreCommitAuditRpcRow
    | SupabaseMigrationPreCommitAuditRpcRow[]
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

interface SupabaseCoreSnapshotRpcResult {
  data:
    | SupabaseCoreSnapshotRpcRow
    | SupabaseCoreSnapshotRpcRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseRemoteHouseholdRpcResult {
  data:
    | SupabaseRemoteHouseholdRpcRow
    | SupabaseRemoteHouseholdRpcRow[]
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
  source_account_id?: string | null;
  destination_account_id?: string | null;
}

interface SupabaseCoreSnapshotRpcRow {
  household_id?: string;
  saved_household_id?: string;
  accounts?: unknown;
  transactions?: unknown;
  saved_at?: string | null;
}

interface SupabaseRemoteHouseholdRpcRow {
  household_id: string;
  household_name: string;
  country: string;
  currency: string;
  timezone: string;
  status: string;
  owner_member_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface SupabaseSettlementMutationRpcResult {
  data:
    | SupabaseSettlementRow
    | SupabaseSettlementRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseSettlementDeleteRpcResult {
  data:
    | SupabaseSettlementDeleteRpcRow
    | SupabaseSettlementDeleteRpcRow[]
    | null;
  error:
    | SupabaseAuthError
    | null;
}

interface SupabaseMigrationDraftRow {
  id: string;
  household_id?: string | null;
  owner_user_id: string;
  owner_member_id: string;
  household_name: string;
  backup_summary?: unknown;
  status: string;
  validated_at?: string | null;
  upload_staged_at?: string | null;
  upload_staged_record_count?: number | null;
  account_upload_staged_at?: string | null;
  account_upload_staged_count?: number | null;
  transaction_upload_staged_at?: string | null;
  transaction_upload_staged_count?: number | null;
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

interface SupabaseSettlementRow {
  id: string;
  household_id: string;
  local_record_id?: string | null;
  from_member_id: string;
  to_member_id: string;
  amount: number;
  settlement_date: string;
  source_account_id?: string | null;
  destination_account_id?: string | null;
  application_method: string;
  reference_number?: string | null;
  notes?: string | null;
  attachments?: unknown;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  updated_by_user_id?: string | null;
}

interface SupabaseSettlementApplicationRow {
  id: string;
  household_id: string;
  local_record_id?: string | null;
  settlement_id: string;
  expense_allocation_id: string;
  applied_amount: number;
  created_at?: string | null;
  updated_at?: string | null;
  updated_by_user_id?: string | null;
}

interface SupabaseSettlementDeleteRpcRow {
  settlement_id: string;
  deleted_at?: string | null;
}

interface SupabaseMigrationUploadStagingRpcRow {
  draft_id: string;
  staged_record_count: number;
  staged_at?: string | null;
}

interface SupabaseMigrationAccountUploadStagingRpcRow {
  draft_id: string;
  staged_account_count: number;
  staged_at?: string | null;
}

interface SupabaseMigrationTransactionUploadStagingRpcRow {
  draft_id: string;
  staged_transaction_count: number;
  staged_at?: string | null;
}

interface SupabaseMigrationPreCommitAuditRpcRow {
  draft_id: string;
  is_ready: boolean;
  blocker_count: number;
  warning_count: number;
  blockers: string[];
  warnings: string[];
  account_count: number;
  transaction_count: number;
  missing_expense_source_account_count: number;
  missing_transaction_account_link_count: number;
  audited_at?: string | null;
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
  sourceAccountLinkedCount: number;
  destinationAccountLinkedCount: number;
  missingAccountLinkCount: number;
  expenseMissingSourceAccountCount: number;
  earliestTransactionDate?: string;
  latestTransactionDate?: string;
}

export interface SupabaseSchemaReadinessCheck {
  id: string;
  label: string;
  ready: boolean;
  detail: string;
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
            "source_account_id",
            "destination_account_id",
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

  async listSchemaReadinessChecks():
    Promise<SupabaseSchemaReadinessCheck[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const checks:
      SupabaseSchemaReadinessCheck[] = [];

    for (const table of schemaReadinessTables) {
      checks.push(
        await this.createSchemaReadinessCheck(
          table
        )
      );
    }

    for (const rpc of schemaReadinessRpcs) {
      checks.push(
        await this.createRpcReadinessCheck(
          rpc
        )
      );
    }

    return checks;
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

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before claiming a household."
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

    if (row.user_id !== user.id) {
      throw new Error(
        "Supabase household claim returned an invalid user."
      );
    }

    const membership =
      mapSupabaseClaimMembership(row);

    if (!membership) {
      throw new Error(
        "Supabase household claim returned an invalid membership."
      );
    }

    const migrationDraft =
      mapSupabaseClaimMigrationDraft(
        row,
        draft
      );

    if (!migrationDraft) {
      throw new Error(
        "Supabase household claim returned an invalid migration draft."
      );
    }

    return {
      householdId:
        row.household_id,
      membership,
      migrationDraft:
        migrationDraft,
    };
  }

  async loadRemoteHousehold(
    householdId: string
  ): Promise<RemoteHousehold> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `household preferences for ${householdId}`
        )
      );
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before loading household preferences."
      );
    }

    const result =
      await (
      await this.getClient()
      )
        .rpc(
          "load_household_preferences",
          {
            target_household_id:
              householdId,
          }
        ) as SupabaseRemoteHouseholdRpcResult;

    return createRemoteHouseholdResult(
      result,
      "load"
    );
  }

  async saveRemoteHouseholdPreferences(
    input: RemoteHouseholdPreferencesInput
  ): Promise<RemoteHousehold> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `household preferences for ${input.householdId}`
        )
      );
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before saving household preferences."
      );
    }

    const result =
      await (
      await this.getClient()
      )
        .rpc(
          "save_household_preferences",
          {
            target_household_id:
              input.householdId,
            input_household_name:
              input.name,
            input_household_country:
              input.country,
            input_household_currency:
              input.currency,
            input_household_timezone:
              input.timezone,
          }
        ) as SupabaseRemoteHouseholdRpcResult;

    return createRemoteHouseholdResult(
      result,
      "save"
    );
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
            "backup_summary",
            "status",
            "validated_at",
            "upload_staged_at",
            "upload_staged_record_count",
            "account_upload_staged_at",
            "account_upload_staged_count",
            "transaction_upload_staged_at",
            "transaction_upload_staged_count",
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
      throw new Error(
        this.createUnavailableMessage(
          `migration validation for ${draftId}`
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
            "upload_staged_at",
            "upload_staged_record_count",
            "account_upload_staged_at",
            "account_upload_staged_count",
            "transaction_upload_staged_at",
            "transaction_upload_staged_count",
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

  async stageMigrationUploadManifest(
    draftId: string,
    manifest: RemoteMigrationUploadManifest
  ): Promise<RemoteMigrationUploadStagingResult> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `migration upload staging for ${draftId}`
        )
      );
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before staging a migration upload manifest."
      );
    }

    const stagingResult =
      await (
      await this.getClient()
      )
        .rpc(
          "stage_migration_upload_manifest",
          {
            target_draft_id:
              draftId,
            expected_record_count:
              manifest.expectedRecordCount,
            draft_upload_manifest:
              manifest,
          }
        ) as SupabaseMigrationUploadStagingRpcResult;

    if (stagingResult.error) {
      throw new Error(
        `Supabase migration upload staging failed: ${stagingResult.error.message}`
      );
    }

    const row =
      readSingleSupabaseRpcRow(
        stagingResult.data
      );

    if (
      !row ||
      row.draft_id !== draftId ||
      row.staged_record_count !==
        manifest.expectedRecordCount
    ) {
      throw new Error(
        "Supabase migration upload staging returned an invalid result."
      );
    }

    return {
      draftId,
      stagedRecordCount:
        row.staged_record_count,
      stagedAt:
        mapSupabaseDate(
          row.staged_at ??
            undefined
        ),
    };
  }

  async stageMigrationAccounts(
    draftId: string,
    payload: RemoteMigrationAccountUploadPayload
  ): Promise<RemoteMigrationAccountUploadStagingResult> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `migration account staging for ${draftId}`
        )
      );
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before staging migration accounts."
      );
    }

    const stagingResult =
      await (
      await this.getClient()
      )
        .rpc(
          "stage_migration_accounts",
          {
            target_draft_id:
              draftId,
            expected_account_count:
              payload.expectedAccountCount,
            staged_accounts:
              payload.accounts,
          }
        ) as SupabaseMigrationAccountUploadStagingRpcResult;

    if (stagingResult.error) {
      throw new Error(
        `Supabase migration account staging failed: ${stagingResult.error.message}`
      );
    }

    const row =
      readSingleSupabaseRpcRow(
        stagingResult.data
      );

    if (
      !row ||
      row.draft_id !== draftId ||
      row.staged_account_count !==
        payload.expectedAccountCount
    ) {
      throw new Error(
        "Supabase migration account staging returned an invalid result."
      );
    }

    return {
      draftId,
      stagedAccountCount:
        row.staged_account_count,
      stagedAt:
        mapSupabaseDate(
          row.staged_at ??
            undefined
        ),
    };
  }

  async stageMigrationTransactions(
    draftId: string,
    payload: RemoteMigrationTransactionUploadPayload
  ): Promise<RemoteMigrationTransactionUploadStagingResult> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `migration transaction staging for ${draftId}`
        )
      );
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before staging migration transactions."
      );
    }

    const stagingResult =
      await (
      await this.getClient()
      )
        .rpc(
          "stage_migration_transactions",
          {
            target_draft_id:
              draftId,
            expected_transaction_count:
              payload.expectedTransactionCount,
            staged_transactions:
              payload.transactions,
          }
        ) as SupabaseMigrationTransactionUploadStagingRpcResult;

    if (stagingResult.error) {
      throw new Error(
        `Supabase migration transaction staging failed: ${stagingResult.error.message}`
      );
    }

    const row =
      readSingleSupabaseRpcRow(
        stagingResult.data
      );

    if (
      !row ||
      row.draft_id !== draftId ||
      row.staged_transaction_count !==
        payload.expectedTransactionCount
    ) {
      throw new Error(
        "Supabase migration transaction staging returned an invalid result."
      );
    }

    return {
      draftId,
      stagedTransactionCount:
        row.staged_transaction_count,
      stagedAt:
        mapSupabaseDate(
          row.staged_at ??
            undefined
        ),
    };
  }

  async auditMigrationPreCommit(
    draftId: string
  ): Promise<RemoteMigrationPreCommitAudit> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `migration pre-commit audit for ${draftId}`
        )
      );
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before auditing a migration commit."
      );
    }

    const auditResult =
      await (
      await this.getClient()
      )
        .rpc(
          "audit_migration_precommit",
          {
            target_draft_id:
              draftId,
          }
        ) as SupabaseMigrationPreCommitAuditRpcResult;

    if (auditResult.error) {
      throw new Error(
        `Supabase migration pre-commit audit failed: ${auditResult.error.message}`
      );
    }

    const row =
      readSingleSupabaseRpcRow(
        auditResult.data
      );

    if (
      !row ||
      row.draft_id !== draftId
    ) {
      throw new Error(
        "Supabase migration pre-commit audit returned an invalid result."
      );
    }

    return mapSupabasePreCommitAudit(row);
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

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before committing a migration draft."
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

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before aborting a migration draft."
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

  async loadRemoteCoreSnapshot(
    householdId: string
  ): Promise<RemoteHouseholdCoreSnapshot> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `core household snapshot load for ${householdId}`
        )
      );
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before loading core finance records."
      );
    }

    const result =
      await (
      await this.getClient()
      )
        .rpc(
          "load_household_core_snapshot",
          {
            target_household_id:
              householdId,
          }
        ) as SupabaseCoreSnapshotRpcResult;

    return createRemoteCoreSnapshotResult(
      result,
      "load"
    );
  }

  async saveRemoteCoreSnapshot(
    input: RemoteHouseholdCoreSnapshotInput
  ): Promise<RemoteHouseholdCoreSnapshot> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `core household snapshot save for ${input.householdId}`
        )
      );
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before saving core finance records."
      );
    }

    const result =
      await (
      await this.getClient()
      )
        .rpc(
          "save_household_core_snapshot",
          {
            target_household_id:
              input.householdId,
            core_accounts:
              input.accounts,
            core_transactions:
              input.transactions,
          }
        ) as SupabaseCoreSnapshotRpcResult;

    return createRemoteCoreSnapshotResult(
      result,
      "save"
    );
  }

  async listRemoteSettlements(
    householdId: string
  ): Promise<RemoteSettlement[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const settlementResult =
      await (
      await this.getClient()
      )
        .from("settlements")
        .select(
          [
            "id",
            "household_id",
            "local_record_id",
            "from_member_id",
            "to_member_id",
            "amount",
            "settlement_date",
            "source_account_id",
            "destination_account_id",
            "application_method",
            "reference_number",
            "notes",
            "attachments",
            "is_active",
            "created_at",
            "updated_at",
            "updated_by_user_id",
          ].join(",")
        )
        .eq(
          "household_id",
          householdId
        ) as SupabaseSettlementRowsResult;

    if (settlementResult.error) {
      throw new Error(
        `Supabase settlement lookup failed: ${settlementResult.error.message}`
      );
    }

    return (settlementResult.data ?? [])
      .map(mapSupabaseSettlement)
      .filter(
        (
          settlement
        ): settlement is RemoteSettlement =>
          Boolean(settlement)
      );
  }

  async createRemoteSettlement(
    input: RemoteSettlementCreateInput
  ): Promise<RemoteSettlementMutationResult> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `settlement creation for ${input.settlement.householdId}`
        )
      );
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before creating a settlement."
      );
    }

    const client =
      await this.getClient();
    const parameters =
      {
        target_household_id:
          input.settlement.householdId,
        ...createSupabaseSettlementMutationParameters(
          input
        ),
      };

    let result =
      await client.rpc(
        "create_household_settlement",
        parameters
      ) as SupabaseSettlementMutationRpcResult;

    if (
      shouldRetryLegacySettlementRpc(
        result,
        input.settlement.attachments
      )
    ) {
      result =
        await client.rpc(
          "create_household_settlement",
          createLegacySupabaseSettlementMutationParameters(
            parameters
          )
        ) as SupabaseSettlementMutationRpcResult;
    }

    return this
      .createRemoteSettlementMutationResult(
        result,
        "creation"
      );
  }

  async updateRemoteSettlement(
    input: RemoteSettlementUpdateInput
  ): Promise<RemoteSettlementMutationResult> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `settlement update for ${input.settlementId}`
        )
      );
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before updating a settlement."
      );
    }

    const client =
      await this.getClient();
    const parameters =
      createSupabaseSettlementMutationParameters(
        input
      );

    let result =
      await client.rpc(
        "update_household_settlement",
        {
          target_settlement_id:
            input.settlementId,
          ...parameters,
        }
      ) as SupabaseSettlementMutationRpcResult;

    if (
      shouldRetryLegacySettlementRpc(
        result,
        input.settlement.attachments
      )
    ) {
      result =
        await client.rpc(
          "update_household_settlement",
          {
            target_settlement_id:
              input.settlementId,
            ...createLegacySupabaseSettlementMutationParameters(
              parameters
            ),
          }
        ) as SupabaseSettlementMutationRpcResult;
    }

    return this
      .createRemoteSettlementMutationResult(
        result,
        "update"
      );
  }

  async deleteRemoteSettlement(
    householdId: string,
    settlementId: string
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error(
        this.createUnavailableMessage(
          `settlement deletion for ${settlementId}`
        )
      );
    }

    const user =
      await this.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before deleting a settlement."
      );
    }

    const result =
      await (
      await this.getClient()
      )
        .rpc(
          "delete_household_settlement",
          {
            target_household_id:
              householdId,
            target_settlement_id:
              settlementId,
          }
        ) as SupabaseSettlementDeleteRpcResult;

    if (result.error) {
      throw new Error(
        `Supabase settlement deletion failed: ${result.error.message}`
      );
    }

    const row =
      readSingleSupabaseRpcRow(
        result.data
      );

    if (
      !row ||
      row.settlement_id !==
        settlementId
    ) {
      throw new Error(
        "Supabase settlement deletion returned an invalid result."
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

  subscribeToCoreSnapshotChanges(
    householdId: string,
    onChange: () => void
  ): AuthSessionSubscription {
    if (
      !this.isConfigured() ||
      !householdId
    ) {
      return createNoopSubscription();
    }

    let isDisposed = false;
    const getClient =
      () => this.getClient();
    const channelPromise =
      getClient()
        .then((client) => {
          if (!client.channel) {
            return undefined;
          }

          return client
            .channel(
              `hfos-core-snapshot-${householdId}`
            )
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table:
                  "household_core_snapshots",
                filter:
                  `household_id=eq.${householdId}`,
              },
              () => {
                if (!isDisposed) {
                  onChange();
                }
              }
            )
            .subscribe();
        });

    return {
      unsubscribe() {
        isDisposed = true;
        void channelPromise
          .then(async (channel) => {
            if (!channel) {
              return;
            }

            const client =
              await getClient();

            if (client.removeChannel) {
              await client.removeChannel(
                channel
              );
              return;
            }

            await channel.unsubscribe?.();
          });
      },
    };
  }

  subscribeToSettlementChanges(
    householdId: string,
    onChange: () => void
  ): AuthSessionSubscription {
    if (
      !this.isConfigured() ||
      !householdId
    ) {
      return createNoopSubscription();
    }

    let isDisposed = false;
    const getClient =
      () => this.getClient();
    const channelPromise =
      getClient()
        .then((client) => {
          if (!client.channel) {
            return undefined;
          }

          return client
            .channel(
              `hfos-settlements-${householdId}`
            )
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table:
                  "settlements",
                filter:
                  `household_id=eq.${householdId}`,
              },
              () => {
                if (!isDisposed) {
                  onChange();
                }
              }
            )
            .subscribe();
        });

    return {
      unsubscribe() {
        isDisposed = true;
        void channelPromise
          .then(async (channel) => {
            if (!channel) {
              return;
            }

            const client =
              await getClient();

            if (client.removeChannel) {
              await client.removeChannel(
                channel
              );
              return;
            }

            await channel.unsubscribe?.();
          });
      },
    };
  }

  subscribeToHouseholdPreferenceChanges(
    householdId: string,
    onChange: () => void
  ): AuthSessionSubscription {
    if (
      !this.isConfigured() ||
      !householdId
    ) {
      return createNoopSubscription();
    }

    let isDisposed = false;
    const getClient =
      () => this.getClient();
    const channelPromise =
      getClient()
        .then((client) => {
          if (!client.channel) {
            return undefined;
          }

          return client
            .channel(
              `hfos-household-preferences-${householdId}`
            )
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table:
                  "households",
                filter:
                  `id=eq.${householdId}`,
              },
              () => {
                if (!isDisposed) {
                  onChange();
                }
              }
            )
            .subscribe();
        });

    return {
      unsubscribe() {
        isDisposed = true;
        void channelPromise
          .then(async (channel) => {
            if (!channel) {
              return;
            }

            const client =
              await getClient();

            if (client.removeChannel) {
              await client.removeChannel(
                channel
              );
              return;
            }

            await channel.unsubscribe?.();
          });
      },
    };
  }

  private async createRemoteSettlementMutationResult(
    result:
      SupabaseSettlementMutationRpcResult,
    action: string
  ): Promise<RemoteSettlementMutationResult> {
    const settlement =
      createRemoteSettlementMutationSettlement(
        result,
        action
      );

    const applications =
      await this
        .listRemoteSettlementApplications(
          settlement.id
        );

    return {
      settlement,
      applications,
    };
  }

  private async listRemoteSettlementApplications(
    settlementId: string
  ): Promise<RemoteSettlementApplication[]> {
    const applicationResult =
      await (
      await this.getClient()
      )
        .from("settlement_applications")
        .select(
          [
            "id",
            "household_id",
            "local_record_id",
            "settlement_id",
            "expense_allocation_id",
            "applied_amount",
            "created_at",
            "updated_at",
            "updated_by_user_id",
          ].join(",")
        )
        .eq(
          "settlement_id",
          settlementId
        ) as SupabaseSettlementApplicationRowsResult;

    if (applicationResult.error) {
      throw new Error(
        `Supabase settlement application lookup failed: ${applicationResult.error.message}`
      );
    }

    return (
      applicationResult.data ?? []
    )
      .map(
        mapSupabaseSettlementApplication
      )
      .filter(
        (
          application
        ): application is RemoteSettlementApplication =>
          Boolean(application)
      );
  }

  private async createSchemaReadinessCheck(
    table: SupabaseSchemaReadinessTable
  ): Promise<SupabaseSchemaReadinessCheck> {
    const probeResult =
      await (
      await this.getClient()
      )
        .from(table.tableName)
        .select("id")
        .eq(
          "id",
          schemaReadinessProbeId
        ) as SupabaseSchemaProbeRowsResult;

    if (probeResult.error) {
      return {
        id:
          table.id,
        label:
          table.label,
        ready: false,
        detail:
          probeResult.error.message,
      };
    }

    return {
      id:
        table.id,
      label:
        table.label,
      ready: true,
      detail:
        `${table.tableName} is queryable.`,
    };
  }

  private async createRpcReadinessCheck(
    rpc: SupabaseSchemaReadinessRpc
  ): Promise<SupabaseSchemaReadinessCheck> {
    const rpcResult =
      await (
      await this.getClient()
      )
        .rpc(
          rpc.functionName,
          rpc.parameters
        );

    const error =
      "error" in rpcResult
        ? rpcResult.error
        : null;

    if (
      error &&
      isMissingSchemaCacheFunctionError(
        error.message
      )
    ) {
      return {
        id:
          rpc.id,
        label:
          rpc.label,
        ready: false,
        detail:
          `${rpc.functionName} is missing from the PostgREST schema cache. Run the latest Supabase schema SQL, then notify pgrst, 'reload schema'.`,
      };
    }

    return {
      id:
        rpc.id,
      label:
        rpc.label,
      ready: true,
      detail:
        `${rpc.functionName} is visible to PostgREST.`,
    };
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

const schemaReadinessProbeId =
  "00000000-0000-0000-0000-000000000000";

interface SupabaseSchemaReadinessTable {
  id: string;
  label: string;
  tableName: string;
}

interface SupabaseSchemaReadinessRpc {
  id: string;
  label: string;
  functionName: string;
  parameters: Record<string, unknown>;
}

const schemaReadinessTables:
  SupabaseSchemaReadinessTable[] = [
    {
      id: "accounts",
      label: "Accounts",
      tableName: "accounts",
    },
    {
      id: "transactions",
      label: "Transactions",
      tableName: "transactions",
    },
    {
      id: "expense-allocations",
      label: "Expense allocations",
      tableName: "expense_allocations",
    },
    {
      id: "utility-provider-bills",
      label: "Provider bills",
      tableName: "utility_provider_bills",
    },
    {
      id: "settlements",
      label: "Settlements",
      tableName: "settlements",
    },
    {
      id: "settlement-applications",
      label: "Settlement applications",
      tableName: "settlement_applications",
    },
    {
      id: "savings-goals",
      label: "Savings goals",
      tableName: "savings_goals",
    },
    {
      id: "savings-activities",
      label: "Savings activities",
      tableName: "savings_activities",
    },
  ];

const schemaReadinessRpcs:
  SupabaseSchemaReadinessRpc[] = [
    {
      id: "rpc-load-household-preferences",
      label:
        "Load household preferences RPC",
      functionName:
        "load_household_preferences",
      parameters: {
        target_household_id:
          schemaReadinessProbeId,
      },
    },
    {
      id: "rpc-save-household-preferences",
      label:
        "Save household preferences RPC",
      functionName:
        "save_household_preferences",
      parameters: {
        target_household_id:
          schemaReadinessProbeId,
        input_household_name:
          "Schema Readiness Probe",
        input_household_country: "PH",
        input_household_currency:
          "PHP",
        input_household_timezone:
          "Asia/Manila",
      },
    },
    {
      id: "rpc-load-household-core-snapshot",
      label:
        "Load core snapshot RPC",
      functionName:
        "load_household_core_snapshot",
      parameters: {
        target_household_id:
          schemaReadinessProbeId,
      },
    },
    {
      id: "rpc-save-household-core-snapshot",
      label:
        "Save core snapshot RPC",
      functionName:
        "save_household_core_snapshot",
      parameters: {
        target_household_id:
          schemaReadinessProbeId,
        core_accounts: [],
        core_transactions: [],
      },
    },
    {
      id: "rpc-create-household-settlement",
      label:
        "Create settlement RPC",
      functionName:
        "create_household_settlement",
      parameters: {
        target_household_id:
          schemaReadinessProbeId,
        local_record_id:
          "schema-readiness-probe",
        from_member_id:
          "schema-readiness-from-member",
        to_member_id:
          "schema-readiness-to-member",
        settlement_amount: 1,
        settlement_date:
          "2026-07-30",
        source_account_id: null,
        destination_account_id: null,
        application_method:
          "oldest-first",
        reference_number: "",
        settlement_notes: "",
        settlement_attachments: [],
        settlement_applications: [],
        is_active: true,
      },
    },
    {
      id: "rpc-update-household-settlement",
      label:
        "Update settlement RPC",
      functionName:
        "update_household_settlement",
      parameters: {
        target_household_id:
          schemaReadinessProbeId,
        target_settlement_id:
          schemaReadinessProbeId,
        local_record_id:
          "schema-readiness-probe",
        from_member_id:
          "schema-readiness-from-member",
        to_member_id:
          "schema-readiness-to-member",
        settlement_amount: 1,
        settlement_date:
          "2026-07-30",
        source_account_id: null,
        destination_account_id: null,
        application_method:
          "oldest-first",
        reference_number: "",
        settlement_notes: "",
        settlement_attachments: [],
        settlement_applications: [],
        is_active: true,
      },
    },
    {
      id: "rpc-delete-household-settlement",
      label:
        "Delete settlement RPC",
      functionName:
        "delete_household_settlement",
      parameters: {
        target_household_id:
          schemaReadinessProbeId,
        target_settlement_id:
          schemaReadinessProbeId,
      },
    },
  ];

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
  const backupSummary =
    createMigrationBackupSummary(
      row
    );

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
      backupSummary,
    remoteRecordCount:
      countRemoteMigrationRecords(
        backupSummary
      ),
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
    uploadStagedAt:
      mapOptionalSupabaseDate(
        row.upload_staged_at
      ),
    uploadStagedRecordCount:
      row.upload_staged_record_count ??
      undefined,
    accountUploadStagedAt:
      mapOptionalSupabaseDate(
        row.account_upload_staged_at
      ),
    accountUploadStagedCount:
      row.account_upload_staged_count ??
      undefined,
    transactionUploadStagedAt:
      mapOptionalSupabaseDate(
        row.transaction_upload_staged_at
      ),
    transactionUploadStagedCount:
      row.transaction_upload_staged_count ??
      undefined,
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

function createMigrationBackupSummary(
  row: SupabaseMigrationDraftRow
): RemoteMigrationDraft["backupSummary"] {
  const storedSummary =
    readMigrationBackupSummary(
      row.backup_summary
    );

  return {
    householdName:
      storedSummary.householdName ??
      row.household_name,
    remoteHouseholdId:
      row.household_id ??
      undefined,
    authenticatedLinkStatus:
      row.household_id
        ? "linked"
        : "unlinked",
    exportedAt:
      storedSummary.exportedAt ??
      row.created_at ??
      new Date(0).toISOString(),
    accountCount:
      storedSummary.accountCount,
    transactionCount:
      storedSummary.transactionCount,
    expenseAllocationCount:
      storedSummary.expenseAllocationCount,
    settlementCount:
      storedSummary.settlementCount,
    settlementApplicationCount:
      storedSummary.settlementApplicationCount,
    savingsGoalCount:
      storedSummary.savingsGoalCount,
    savingsActivityCount:
      storedSummary.savingsActivityCount,
    providerBillCount:
      storedSummary.providerBillCount,
  };
}

interface StoredMigrationBackupSummary {
  householdName?: string;
  exportedAt?: string;
  accountCount: number;
  transactionCount: number;
  expenseAllocationCount: number;
  settlementCount: number;
  settlementApplicationCount: number;
  savingsGoalCount: number;
  savingsActivityCount: number;
  providerBillCount: number;
}

function readMigrationBackupSummary(
  value: unknown
): StoredMigrationBackupSummary {
  const summary =
    isObjectRecord(value)
      ? value
      : {};

  return {
    householdName:
      readOptionalString(
        summary.householdName
      ),
    exportedAt:
      readOptionalString(
        summary.exportedAt
      ),
    accountCount:
      readOptionalNumber(
        summary.accountCount
      ),
    transactionCount:
      readOptionalNumber(
        summary.transactionCount
      ),
    expenseAllocationCount:
      readOptionalNumber(
        summary.expenseAllocationCount
      ),
    settlementCount:
      readOptionalNumber(
        summary.settlementCount
      ),
    settlementApplicationCount:
      readOptionalNumber(
        summary.settlementApplicationCount
      ),
    savingsGoalCount:
      readOptionalNumber(
        summary.savingsGoalCount
      ),
    savingsActivityCount:
      readOptionalNumber(
        summary.savingsActivityCount
      ),
    providerBillCount:
      readOptionalNumber(
        summary.providerBillCount
      ),
  };
}

function readOptionalString(
  value: unknown
): string | undefined {
  return typeof value === "string" &&
    value.trim()
    ? value
    : undefined;
}

function readOptionalNumber(
  value: unknown
): number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
    ? value
    : 0;
}

function isObjectRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
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

  if (
    !row.household_id ||
    !row.membership_id ||
    !row.user_id ||
    !row.member_id ||
    !role ||
    !status
  ) {
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
): RemoteMigrationDraft | undefined {
  const status =
    normalizeMigrationStatus(
      row.migration_status
    );

  if (
    !row.household_id ||
    !row.member_id ||
    !row.migration_draft_id ||
    !status
  ) {
    return undefined;
  }

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
  };
}

function createRemoteSettlementMutationSettlement(
  result:
    SupabaseSettlementMutationRpcResult,
  action: string
): RemoteSettlement {
  if (result.error) {
    throw new Error(
      `Supabase settlement ${action} failed: ${createSupabaseRpcErrorMessage(
        result.error.message,
        `settlement ${action}`
      )}`
    );
  }

  const row =
    readSingleSupabaseRpcRow(
      result.data
    );
  const settlement =
    row
      ? mapSupabaseSettlement(row)
      : undefined;

  if (!settlement) {
    throw new Error(
      `Supabase settlement ${action} returned an invalid result.`
    );
  }

  return settlement;
}

function createRemoteCoreSnapshotResult(
  result: SupabaseCoreSnapshotRpcResult,
  action: string
): RemoteHouseholdCoreSnapshot {
  if (result.error) {
    throw new Error(
      `Supabase core household snapshot ${action} failed: ${result.error.message}`
    );
  }

  const row =
    readSingleSupabaseRpcRow(
      result.data
    );
  const householdId =
    row?.saved_household_id ??
    row?.household_id;

  if (
    !row ||
    !householdId ||
    !isRemoteAccountUploadRecordArray(
      row.accounts
    ) ||
    !isRemoteTransactionUploadRecordArray(
      row.transactions
    )
  ) {
    throw new Error(
      `Supabase core household snapshot ${action} returned an invalid result.`
    );
  }

  return {
    householdId:
      householdId,
    accounts:
      row.accounts,
    transactions:
      row.transactions,
    savedAt:
      mapSupabaseDate(
        row.saved_at ?? undefined
      ),
  };
}

function createRemoteHouseholdResult(
  result: SupabaseRemoteHouseholdRpcResult,
  action: string
): RemoteHousehold {
  if (result.error) {
    const message =
      createSupabaseRpcErrorMessage(
        result.error.message,
        "household preferences"
      );

    throw new Error(
      `Supabase household preferences ${action} failed: ${message}`
    );
  }

  const row =
    readSingleSupabaseRpcRow(
      result.data
    );

  if (
    !row ||
    !row.household_id ||
    !row.household_name ||
    !row.country ||
    !row.currency ||
    !row.timezone ||
    !row.status
  ) {
    throw new Error(
      `Supabase household preferences ${action} returned an invalid result.`
    );
  }

  return {
    id:
      row.household_id,
    name:
      row.household_name,
    country:
      row.country,
    currency:
      row.currency,
    timezone:
      row.timezone,
    ownerMemberId:
      row.owner_member_id ?? "",
    status:
      row.status === "deleted" ||
      row.status === "archived"
        ? row.status
        : "active",
    createdAt:
      mapSupabaseDate(
        row.created_at ?? undefined
      ),
    updatedAt:
      mapSupabaseDate(
        row.updated_at ??
          row.created_at ??
          undefined
      ),
  };
}

function createSupabaseRpcErrorMessage(
  message: string,
  area: string
): string {
  if (
    isMissingSchemaCacheFunctionError(
      message
    )
  ) {
    return (
      `Supabase ${area} RPC is missing from the production schema cache. ` +
      "Run the latest Supabase schema SQL, then reload the PostgREST schema cache."
    );
  }

  return message;
}

function isMissingSchemaCacheFunctionError(
  message: string
): boolean {
  return (
    message.includes(
      "Could not find the function"
    ) &&
    message.includes(
      "schema cache"
    )
  );
}

function isRemoteAccountUploadRecordArray(
  value: unknown
): value is RemoteMigrationAccountUploadRecord[] {
  return (
    Array.isArray(value) &&
    value.every(
      (record) =>
        isRecord(record) &&
        typeof record.id ===
          "string" &&
        typeof record.name ===
          "string"
    )
  );
}

function isRemoteTransactionUploadRecordArray(
  value: unknown
): value is RemoteMigrationTransactionUploadRecord[] {
  return (
    Array.isArray(value) &&
    value.every(
      (record) =>
        isRecord(record) &&
        typeof record.id ===
          "string" &&
        typeof record.type ===
          "string"
    )
  );
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function isStoredAttachmentCategory(
  value: unknown
): value is StoredAttachmentCategory {
  return (
    value === "receipt" ||
    value === "bill" ||
    value === "other"
  );
}

function createSupabaseSettlementMutationParameters(
  input:
    | RemoteSettlementCreateInput
    | RemoteSettlementUpdateInput
): Record<string, unknown> {
  return {
    local_record_id:
      input.settlement.localRecordId ??
      null,
    from_member_id:
      input.settlement.fromMemberId,
    to_member_id:
      input.settlement.toMemberId,
    settlement_amount:
      input.settlement.amount,
    settlement_date:
      input.settlement.settlementDate,
    source_account_id:
      input.settlement.sourceAccountId ??
      null,
    destination_account_id:
      input.settlement
        .destinationAccountId ?? null,
    application_method:
      input.settlement.applicationMethod,
    reference_number:
      input.settlement.referenceNumber ??
      null,
    settlement_notes:
      input.settlement.notes ?? null,
    settlement_attachments:
      createSupabaseSettlementAttachmentPayload(
        input.settlement.attachments ??
          []
      ),
    is_active:
      input.settlement.isActive,
    settlement_applications:
      createSupabaseSettlementApplicationPayload(
        input.applications ?? []
      ),
  };
}

function createLegacySupabaseSettlementMutationParameters(
  parameters: Record<string, unknown>
): Record<string, unknown> {
  const {
    settlement_attachments:
      _settlementAttachments,
    ...legacyParameters
  } = parameters;

  return legacyParameters;
}

function shouldRetryLegacySettlementRpc(
  result:
    SupabaseSettlementMutationRpcResult,
  attachments:
    StoredAttachment[] | undefined
): boolean {
  return Boolean(
    result.error &&
      (attachments?.length ?? 0) ===
        0 &&
      result.error.message.includes(
        "Could not find the function"
      ) &&
      result.error.message.includes(
        "schema cache"
      )
  );
}

function createSupabaseSettlementAttachmentPayload(
  attachments: StoredAttachment[]
) {
  return attachments.map(
    (attachment) => ({
      id: attachment.id,
      category:
        attachment.category,
      fileName:
        attachment.fileName,
      mimeType:
        attachment.mimeType,
      sizeBytes:
        attachment.sizeBytes,
      dataUrl:
        attachment.dataUrl,
      createdAt:
        attachment.createdAt.toISOString(),
    })
  );
}

function mapSupabaseSettlementAttachments(
  value: unknown
): StoredAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((record) => {
      if (
        typeof record.id !==
          "string" ||
        typeof record.fileName !==
          "string" ||
        typeof record.mimeType !==
          "string" ||
        typeof record.sizeBytes !==
          "number" ||
        !Number.isFinite(
          record.sizeBytes
        ) ||
        typeof record.dataUrl !==
          "string"
      ) {
        return undefined;
      }

      return {
        id: record.id,
        category:
          isStoredAttachmentCategory(
            record.category
          )
            ? record.category
            : "other",
        fileName:
          record.fileName,
        mimeType:
          record.mimeType,
        sizeBytes:
          record.sizeBytes,
        dataUrl:
          record.dataUrl,
        createdAt:
          mapSupabaseDate(
            typeof record.createdAt ===
              "string"
              ? record.createdAt
              : undefined
          ),
      };
    })
    .filter(
      (
        attachment
      ): attachment is StoredAttachment =>
        Boolean(attachment)
    );
}

function createSupabaseSettlementApplicationPayload(
  applications: Array<{
    localRecordId?: string;
    expenseAllocationId: string;
    appliedAmount: number;
  }>
) {
  return applications.map(
    (application) => ({
      local_record_id:
        application.localRecordId ??
        crypto.randomUUID(),
      expense_allocation_id:
        application.expenseAllocationId,
      applied_amount:
        application.appliedAmount,
    })
  );
}

function mapSupabaseSettlement(
  row: SupabaseSettlementRow
): RemoteSettlement | undefined {
  const applicationMethod =
    normalizeSettlementApplicationMethod(
      row.application_method
    );

  if (
    !row.id ||
    !row.household_id ||
    !row.from_member_id ||
    !row.to_member_id ||
    !Number.isFinite(row.amount) ||
    !row.settlement_date ||
    !applicationMethod
  ) {
    return undefined;
  }

  return {
    id:
      row.id,
    householdId:
      row.household_id,
    localRecordId:
      row.local_record_id ?? undefined,
    fromMemberId:
      row.from_member_id,
    toMemberId:
      row.to_member_id,
    amount:
      row.amount,
    settlementDate:
      new Date(
        `${row.settlement_date}T00:00:00`
      ),
    sourceAccountId:
      row.source_account_id ??
      undefined,
    destinationAccountId:
      row.destination_account_id ??
      undefined,
    applicationMethod:
      applicationMethod,
    referenceNumber:
      row.reference_number ??
      undefined,
    notes:
      row.notes ?? undefined,
    attachments:
      mapSupabaseSettlementAttachments(
        row.attachments
      ),
    isActive:
      row.is_active,
    createdAt:
      mapSupabaseDate(
        row.created_at ?? undefined
      ),
    updatedAt:
      mapSupabaseDate(
        row.updated_at ??
          row.created_at ??
          undefined
      ),
    updatedByUserId:
      row.updated_by_user_id ??
      undefined,
  };
}

function mapSupabaseSettlementApplication(
  row: SupabaseSettlementApplicationRow
): RemoteSettlementApplication | undefined {
  if (
    !row.id ||
    !row.household_id ||
    !row.settlement_id ||
    !row.expense_allocation_id ||
    !Number.isFinite(row.applied_amount)
  ) {
    return undefined;
  }

  return {
    id:
      row.id,
    householdId:
      row.household_id,
    localRecordId:
      row.local_record_id ?? undefined,
    settlementId:
      row.settlement_id,
    expenseAllocationId:
      row.expense_allocation_id,
    appliedAmount:
      row.applied_amount,
    createdAt:
      mapSupabaseDate(
        row.created_at ?? undefined
      ),
    updatedAt:
      mapSupabaseDate(
        row.updated_at ??
          row.created_at ??
          undefined
      ),
    updatedByUserId:
      row.updated_by_user_id ??
      undefined,
  };
}

function normalizeSettlementApplicationMethod(
  value: string
): RemoteSettlement["applicationMethod"] | undefined {
  if (
    value === "oldest-first" ||
    value === "manual"
  ) {
    return value;
  }

  return undefined;
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
    sourceAccountLinkedCount:
      0,
    destinationAccountLinkedCount:
      0,
    missingAccountLinkCount:
      0,
    expenseMissingSourceAccountCount:
      0,
  };
}

function mapSupabasePreCommitAudit(
  row: SupabaseMigrationPreCommitAuditRpcRow
): RemoteMigrationPreCommitAudit {
  return {
    draftId:
      row.draft_id,
    isReady:
      row.is_ready,
    blockerCount:
      row.blocker_count,
    warningCount:
      row.warning_count,
    blockers:
      row.blockers ?? [],
    warnings:
      row.warnings ?? [],
    accountCount:
      row.account_count,
    transactionCount:
      row.transaction_count,
    missingExpenseSourceAccountCount:
      row.missing_expense_source_account_count,
    missingTransactionAccountLinkCount:
      row.missing_transaction_account_link_count,
    auditedAt:
      mapSupabaseDate(
        row.audited_at ?? undefined
      ),
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

    if (row.source_account_id) {
      summary.sourceAccountLinkedCount += 1;
    }

    if (row.destination_account_id) {
      summary.destinationAccountLinkedCount += 1;
    }

    if (
      !row.source_account_id &&
      !row.destination_account_id
    ) {
      summary.missingAccountLinkCount += 1;
    }

    if (
      row.type === "expense" &&
      !row.source_account_id
    ) {
      summary.expenseMissingSourceAccountCount += 1;
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

function createNoopSubscription():
  AuthSessionSubscription {
  return {
    unsubscribe() {
      return undefined;
    },
  };
}
