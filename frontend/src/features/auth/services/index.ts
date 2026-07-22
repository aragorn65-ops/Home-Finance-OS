export type {
  AuthBackendAdapter,
  AuthSignInRequest,
  AuthSessionObserver,
  AuthSessionSubscription,
  HouseholdClaimDraft,
  HouseholdClaimResult,
} from "./AuthBackendAdapter";

export type {
  RemoteMigrationRepository,
} from "./RemoteMigrationRepository";

export type {
  CreateRemoteHouseholdInput,
  InviteHouseholdMemberInput,
  RemoteTenantRepository,
  UpdateMembershipRoleInput,
} from "./RemoteTenantRepository";

export {
  DisabledAuthBackendAdapter,
} from "./disabledAuthBackendAdapter";

export {
  DisabledRemoteMigrationRepository,
} from "./disabledRemoteMigrationRepository";

export {
  DisabledRemoteTenantRepository,
} from "./disabledRemoteTenantRepository";

export {
  InMemoryAuthBackendAdapter,
} from "./inMemoryAuthBackendAdapter";

export {
  SupabaseAuthBackendAdapter,
} from "./supabaseAuthBackendAdapter";

export type {
  SupabaseAuthBackendAdapterConfig,
  SupabaseAccountDiagnosticSummary,
  SupabaseHouseholdDiagnostic,
  SupabaseTransactionDiagnosticSummary,
} from "./supabaseAuthBackendAdapter";

export {
  InMemoryAuthStore,
  createId,
  createMembership,
} from "./inMemoryAuthStore";

export type {
  InMemoryAuthSeed,
} from "./inMemoryAuthStore";

export {
  InMemoryRemoteMigrationRepository,
} from "./inMemoryRemoteMigrationRepository";

export {
  InMemoryRemoteTenantRepository,
} from "./inMemoryRemoteTenantRepository";

export {
  getAuthBackendAdapter,
} from "./createAuthBackendAdapter";

export {
  canAccessAccount,
  canAccessHousehold,
  canAccessTenantRecord,
  canManageMemberRole,
} from "./authorization";

export type {
  AuthorizationContext,
  FinancialRecordAction,
  HouseholdAction,
} from "./authorization";

export {
  createAuthMigrationPreview,
} from "./createAuthMigrationPreview";

export {
  createAuthDiagnostics,
  createAuthDiagnosticsForAdapter,
} from "./createAuthDiagnostics";
