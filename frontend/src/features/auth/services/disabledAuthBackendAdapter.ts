import type {
  AuthBackendAdapter,
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

export class DisabledAuthBackendAdapter
  implements AuthBackendAdapter
{
  async getSession(): Promise<AuthSession> {
    return {
      status: "disabled",
    };
  }

  async signIn(): Promise<AuthSession> {
    return {
      status: "disabled",
    };
  }

  async signOut(): Promise<void> {
    return Promise.resolve();
  }

  async getCurrentUser():
    Promise<AuthUser | undefined> {
    return undefined;
  }

  async listMemberships():
    Promise<HouseholdMembership[]> {
    return [];
  }

  async listInvitations():
    Promise<HouseholdInvitation[]> {
    return [];
  }

  async createHouseholdClaimDraft(
    draft: HouseholdClaimDraft
  ): Promise<HouseholdClaimResult> {
    throw new Error(
      `Authenticated household migration is disabled for ${draft.householdName}.`
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
        "Remote migration is disabled.",
      ],
    };
  }

  async commitMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult> {
    throw new Error(
      `Remote migration commit is disabled for ${draftId}.`
    );
  }

  async abortMigrationDraft():
    Promise<void> {
    return Promise.resolve();
  }
}
