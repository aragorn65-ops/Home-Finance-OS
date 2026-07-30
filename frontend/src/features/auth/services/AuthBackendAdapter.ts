import type {
  ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";
import type {
  RemoteMigrationAccountUploadPayload,
  RemoteMigrationAccountUploadStagingResult,
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationPreCommitAudit,
  RemoteMigrationTransactionUploadPayload,
  RemoteMigrationTransactionUploadStagingResult,
  RemoteMigrationUploadManifest,
  RemoteMigrationUploadStagingResult,
  RemoteMigrationValidation,
  RemoteSettlement,
  RemoteSettlementCreateInput,
  RemoteSettlementMutationResult,
  RemoteSettlementUpdateInput,
  AuthSession,
  AuthUser,
  HouseholdInvitation,
  HouseholdMembership,
} from "../models";

export interface HouseholdClaimDraft {
  householdName: string;
  backupSummary: ApplicationBackupSummary;
  ownerMemberId: string;
  claimedHouseholdId?: string;
}

export interface HouseholdClaimResult {
  householdId: string;
  membership: HouseholdMembership;
  migrationDraft: RemoteMigrationDraft;
}

export interface AuthSignInRequest {
  email?: string;
  redirectTo?: string;
}

export interface AuthSessionSubscription {
  unsubscribe(): void;
}

export interface AuthSessionObserver {
  subscribeToSessionChanges?(
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

  createHouseholdClaimDraft(
    draft: HouseholdClaimDraft
  ): Promise<HouseholdClaimResult>;

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

  listRemoteSettlements(
    householdId: string
  ): Promise<RemoteSettlement[]>;

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
