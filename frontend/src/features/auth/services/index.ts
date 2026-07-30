export type {
  AuthBackendAdapter,
  AuthCoreSnapshotObserver,
  AuthSignInRequest,
  AuthSessionObserver,
  AuthSessionSubscription,
  HouseholdClaimDraft,
  HouseholdClaimResult,
  RemoteHouseholdPreferencesInput,
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
  canAccessSettlementRecord,
  canAccessTenantRecord,
  canManageMemberRole,
} from "./authorization";

export {
  evaluateAuthRouteAccess,
} from "./authRouteAccess";

export type {
  AuthRouteAccessInput,
  AuthRouteAccessResult,
  AuthRouteAccessStatus,
} from "./authRouteAccess";

export {
  createMigrationAccountUploadPayload,
  createMigrationTransactionUploadPayload,
} from "./remoteMigrationUploadPayloads";

export {
  createRemoteCoreSnapshotInput,
  getLocalCoreSnapshotCounts,
  loadRemoteCoreSnapshotForHousehold,
  applyRemoteCoreSnapshotToLocalHousehold,
  restoreLinkedRemoteCoreSnapshot,
  saveCurrentBrowserCoreSnapshotForHousehold,
  saveLinkedRemoteCoreSnapshot,
  saveRemoteCoreSnapshotForHousehold,
} from "./coreSnapshotSync";

export type {
  ApplyRemoteCoreSnapshotOptions,
  CoreSnapshotRecordSource,
  CoreSnapshotAdapter,
  CoreSnapshotLocalWriter,
  CurrentBrowserCoreSnapshotOptions,
  LinkedCoreSnapshotHousehold,
  LinkedCoreSnapshotRestoreOptions,
  LinkedCoreSnapshotRestoreResult,
  LinkedCoreSnapshotSaveOptions,
  LinkedCoreSnapshotSaveResult,
  LocalCoreSnapshotCounts,
  LocalCoreSnapshotSource,
} from "./coreSnapshotSync";

export type {
  AuthorizationContext,
  FinancialRecordAction,
  HouseholdAction,
  SettlementAccessRecord,
  SettlementRecordAction,
} from "./authorization";

export {
  createAuthMigrationPreview,
} from "./createAuthMigrationPreview";

export {
  createAuthDiagnostics,
  createAuthDiagnosticsForAdapter,
} from "./createAuthDiagnostics";
