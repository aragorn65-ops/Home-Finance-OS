import type {
  ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";
import type {
  AuthSession,
  AuthUser,
  HouseholdInvitation,
  HouseholdMembership,
} from "../models";

export interface HouseholdClaimDraft {
  householdName: string;
  backupSummary: ApplicationBackupSummary;
  ownerMemberId: string;
}

export interface HouseholdClaimResult {
  householdId: string;
  membership: HouseholdMembership;
}

export interface AuthBackendAdapter {
  getSession(): Promise<AuthSession>;

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
}
