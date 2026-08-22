import type {
  HouseholdMember,
} from "../../household/models/HouseholdMember";
import type {
  ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";
import type {
  RemoteMigrationAccountUploadPayload,
  RemoteMigrationAccountUploadStagingResult,
  RemoteHouseholdCoreSnapshot,
  RemoteHouseholdCoreSnapshotInput,
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationPreCommitAudit,
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
  AuthSession,
  AuthUser,
  HouseholdInvitation,
  HouseholdMembership,
  RemoteHousehold,
} from "../models";

export interface HouseholdClaimDraft {
  householdName: string;
  backupSummary: ApplicationBackupSummary;
  ownerMemberId: string;
  ownerDisplayName?: string;
  claimedHouseholdId?: string;
}

export interface HouseholdClaimResult {
  householdId: string;
  membership: HouseholdMembership;
  migrationDraft: RemoteMigrationDraft;
}

export interface RemoteHouseholdPreferencesInput {
  householdId: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
}

export interface AuthSignInRequest {
  email?: string;
  redirectTo?: string;
}

export interface InviteLinkedHouseholdMemberRequest {
  householdId: string;
  localMemberId: string;
  displayName: string;
  email: string;
  role: HouseholdMembership["role"];
  redirectTo?: string;
}

export interface UpdateRemoteHouseholdMemberProfileRequest {
  householdId: string;
  localMemberId: string;
  displayName: string;
  color?: string;
  isActive?: boolean;
  role?: HouseholdMembership["role"];
}

export interface AuthSessionSubscription {
  unsubscribe(): void;
}

export interface AuthSessionObserver {
  subscribeToSessionChanges?(
    onChange: () => void
  ): AuthSessionSubscription;
}

export interface AuthCoreSnapshotObserver {
  subscribeToCoreSnapshotChanges?(
    householdId: string,
    onChange: () => void
  ): AuthSessionSubscription;
}

export interface AuthSettlementObserver {
  subscribeToSettlementChanges?(
    householdId: string,
    onChange: () => void
  ): AuthSessionSubscription;
}

export interface AuthHouseholdPreferencesObserver {
  subscribeToHouseholdPreferenceChanges?(
    householdId: string,
    onChange: () => void
  ): AuthSessionSubscription;
}

export interface AuthBackendAdapter {
  getSession(): Promise<AuthSession>;

  signIn(
    request?: AuthSignInRequest
  ): Promise<AuthSession>;

  signOut(): Promise<void>;

  getCurrentUser():
    Promise<AuthUser | undefined>;

  listMemberships():
    Promise<HouseholdMembership[]>;

  listInvitations():
    Promise<HouseholdInvitation[]>;

  inviteLinkedHouseholdMember(
    request: InviteLinkedHouseholdMemberRequest
  ): Promise<HouseholdMembership>;

  updateRemoteHouseholdMemberProfile(
    request: UpdateRemoteHouseholdMemberProfileRequest
  ): Promise<HouseholdMember>;

  createHouseholdClaimDraft(
    draft: HouseholdClaimDraft
  ): Promise<HouseholdClaimResult>;

  loadRemoteHousehold(
    householdId: string
  ): Promise<RemoteHousehold>;

  listRemoteHouseholdMembers(
    householdId: string
  ): Promise<HouseholdMember[]>;

  saveRemoteHouseholdPreferences(
    input: RemoteHouseholdPreferencesInput
  ): Promise<RemoteHousehold>;

  listMigrationDrafts():
    Promise<RemoteMigrationDraft[]>;

  validateMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationValidation>;

  stageMigrationUploadManifest(
    draftId: string,
    manifest: RemoteMigrationUploadManifest
  ): Promise<RemoteMigrationUploadStagingResult>;

  stageMigrationAccounts(
    draftId: string,
    payload: RemoteMigrationAccountUploadPayload
  ): Promise<RemoteMigrationAccountUploadStagingResult>;

  stageMigrationTransactions(
    draftId: string,
    payload: RemoteMigrationTransactionUploadPayload
  ): Promise<RemoteMigrationTransactionUploadStagingResult>;

  auditMigrationPreCommit(
    draftId: string
  ): Promise<RemoteMigrationPreCommitAudit>;

  commitMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult>;

  abortMigrationDraft(
    draftId: string
  ): Promise<void>;

  loadRemoteCoreSnapshot(
    householdId: string
  ): Promise<RemoteHouseholdCoreSnapshot>;

  saveRemoteCoreSnapshot(
    input: RemoteHouseholdCoreSnapshotInput
  ): Promise<RemoteHouseholdCoreSnapshot>;

  listRemoteSettlements(
    householdId: string
  ): Promise<RemoteSettlement[]>;

  listRemoteSettlementApplications(
    householdId: string
  ): Promise<RemoteSettlementApplication[]>;

  createRemoteSettlement(
    input: RemoteSettlementCreateInput
  ): Promise<RemoteSettlementMutationResult>;

  updateRemoteSettlement(
    input: RemoteSettlementUpdateInput
  ): Promise<RemoteSettlementMutationResult>;

  deleteRemoteSettlement(
    householdId: string,
    settlementId: string
  ): Promise<void>;
}
