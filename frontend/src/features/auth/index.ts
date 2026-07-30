export type {
  AuthHouseholdRole,
  AuthDiagnostics,
  AuthMigrationPreview,
  AuthMigrationPreviewStatus,
  AuthSession,
  AuthSessionStatus,
  AuthUser,
  HouseholdInvitation,
  HouseholdInvitationStatus,
  HouseholdMembership,
  HouseholdMembershipStatus,
  RemoteHousehold,
  RemoteHouseholdCoreSnapshot,
  RemoteHouseholdCoreSnapshotInput,
  RemoteHouseholdStatus,
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationStatus,
  RemoteMigrationValidation,
  RemoteRecordVisibility,
  RemoteTenantRecord,
} from "./models";

export type {
  AuthBackendAdapter,
  AuthCoreSnapshotObserver,
  AuthHouseholdPreferencesObserver,
  AuthSettlementObserver,
  AuthorizationContext,
  CreateRemoteHouseholdInput,
  FinancialRecordAction,
  HouseholdAction,
  HouseholdClaimDraft,
  HouseholdClaimResult,
  InviteHouseholdMemberInput,
  RemoteHouseholdPreferencesInput,
  RemoteMigrationRepository,
  RemoteTenantRepository,
  UpdateMembershipRoleInput,
} from "./services";

export {
  AuthDiagnosticsPanel,
  AuthRouteGatePanel,
  CoreSnapshotSyncPanel,
  AuthSessionButton,
} from "./components";

export {
  useAuthSession,
  useAuthDiagnostics,
  useHouseholdMembership,
  useLinkedHouseholdPreferencesRestore,
  useLinkedCoreSnapshotRestore,
} from "./hooks";

export {
  coreSnapshotRestoredEvent,
  householdPreferencesRestoredEvent,
} from "./hooks";

export {
  evaluateAuthRouteAccess,
  canAccessAccount,
  canAccessHousehold,
  canAccessTenantRecord,
  canManageMemberRole,
  createAuthDiagnostics,
  createAuthMigrationPreview,
  createRemoteCoreSnapshotInput,
  DisabledAuthBackendAdapter,
  DisabledRemoteMigrationRepository,
  DisabledRemoteTenantRepository,
  getAuthBackendAdapter,
  getLocalCoreSnapshotCounts,
  InMemoryAuthBackendAdapter,
  InMemoryAuthStore,
  InMemoryRemoteMigrationRepository,
  InMemoryRemoteTenantRepository,
  loadRemoteCoreSnapshotForHousehold,
  restoreLinkedRemoteHouseholdPreferences,
  saveCurrentBrowserCoreSnapshotForHousehold,
  saveLinkedRemoteCoreSnapshot,
  saveRemoteCoreSnapshotForHousehold,
} from "./services";

export {
  createId,
  createMembership,
} from "./services";

export type {
  CoreSnapshotAdapter,
  CoreSnapshotRecordSource,
  CurrentBrowserCoreSnapshotOptions,
  InMemoryAuthSeed,
  LinkedCoreSnapshotHousehold,
  LinkedCoreSnapshotSaveOptions,
  LinkedCoreSnapshotSaveResult,
  LinkedHouseholdPreferencesHousehold,
  LinkedHouseholdPreferencesRestoreOptions,
  LinkedHouseholdPreferencesRestoreResult,
  LocalCoreSnapshotCounts,
  LocalCoreSnapshotSource,
} from "./services";
