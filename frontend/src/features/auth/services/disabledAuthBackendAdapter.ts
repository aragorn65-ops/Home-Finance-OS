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
  RemoteMigrationAccountUploadPayload,
  RemoteMigrationAccountUploadStagingResult,
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationTransactionUploadPayload,
  RemoteMigrationTransactionUploadStagingResult,
  RemoteMigrationUploadManifest,
  RemoteMigrationUploadStagingResult,
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
    throw new Error(
      `Remote migration validation is disabled for ${draftId}.`
    );
  }

  async stageMigrationUploadManifest(
    draftId: string,
    _manifest: RemoteMigrationUploadManifest
  ): Promise<RemoteMigrationUploadStagingResult> {
    throw new Error(
      `Remote migration upload staging is disabled for ${draftId}.`
    );
  }

  async stageMigrationAccounts(
    draftId: string,
    _payload: RemoteMigrationAccountUploadPayload
  ): Promise<RemoteMigrationAccountUploadStagingResult> {
    throw new Error(
      `Remote migration account staging is disabled for ${draftId}.`
    );
  }

  async stageMigrationTransactions(
    draftId: string,
    _payload: RemoteMigrationTransactionUploadPayload
  ): Promise<RemoteMigrationTransactionUploadStagingResult> {
    throw new Error(
      `Remote migration transaction staging is disabled for ${draftId}.`
    );
  }

  async commitMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult> {
    throw new Error(
      `Remote migration commit is disabled for ${draftId}.`
    );
  }

  async abortMigrationDraft(
    draftId: string
  ):
    Promise<void> {
    throw new Error(
      `Remote migration abort is disabled for ${draftId}.`
    );
  }
}
