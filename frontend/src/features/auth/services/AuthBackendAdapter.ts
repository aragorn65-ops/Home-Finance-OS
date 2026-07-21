import type {
  ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";
import type {
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationValidation,
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

export interface AuthBackendAdapter {
  getSession(): Promise<AuthSession>;

  signIn(): Promise<AuthSession>;

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

  commitMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult>;

  abortMigrationDraft(
    draftId: string
  ): Promise<void>;
}
