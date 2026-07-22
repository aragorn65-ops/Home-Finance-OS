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
  ): Promise<SupabaseMembershipRowsResult>;
  in(
    column: string,
    values: string[]
  ): Promise<SupabaseHouseholdRowsResult>;
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

export interface SupabaseHouseholdDiagnostic {
  householdId: string;
  householdName: string;
  status: string;
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

    const {
      data,
      error,
    } = await (
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
      );

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

    const {
      data,
      error,
    } = await (
      await this.getClient()
    )
      .from("households")
      .select("id,name,status")
      .in(
        "id",
        uniqueHouseholdIds
      );

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

  async createHouseholdClaimDraft(
    draft: HouseholdClaimDraft
  ): Promise<HouseholdClaimResult> {
    throw new Error(
      this.createUnavailableMessage(
        `household claim for ${draft.householdName}`
      )
    );
  }

  async listMigrationDrafts():
    Promise<RemoteMigrationDraft[]> {
    return [];
  }

  async validateMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationValidation> {
    return {
      draftId,
      isValid: false,
      recordCountsMatch: false,
      warnings: [],
      blockers: [
        this.createUnavailableMessage(
          "migration validation"
        ),
      ],
    };
  }

  async commitMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult> {
    throw new Error(
      this.createUnavailableMessage(
        `migration commit for ${draftId}`
      )
    );
  }

  async abortMigrationDraft():
    Promise<void> {
    return Promise.resolve();
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
