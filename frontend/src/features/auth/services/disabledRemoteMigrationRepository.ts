import type {
  RemoteMigrationAccountUploadStagingResult,
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationTransactionUploadStagingResult,
  RemoteMigrationUploadStagingResult,
  RemoteMigrationValidation,
} from "../models";
import type {
  HouseholdClaimDraft,
} from "./AuthBackendAdapter";
import type {
  RemoteMigrationRepository,
} from "./RemoteMigrationRepository";

export class DisabledRemoteMigrationRepository
  implements RemoteMigrationRepository
{
  async listDrafts():
    Promise<RemoteMigrationDraft[]> {
    return [];
  }

  async createDraft(
    draft: HouseholdClaimDraft
  ): Promise<RemoteMigrationDraft> {
    throw new Error(
      `Remote migration drafts are disabled for ${draft.householdName}.`
    );
  }

  async validateDraft(
    draftId: string
  ): Promise<RemoteMigrationValidation> {
    throw new Error(
      `Remote migration validation is disabled for ${draftId}.`
    );
  }

  async stageUploadManifest(
    draftId: string
  ): Promise<RemoteMigrationUploadStagingResult> {
    throw new Error(
      `Remote migration upload staging is disabled for ${draftId}.`
    );
  }

  async stageAccounts(
    draftId: string
  ): Promise<RemoteMigrationAccountUploadStagingResult> {
    throw new Error(
      `Remote migration account staging is disabled for ${draftId}.`
    );
  }

  async stageTransactions(
    draftId: string
  ): Promise<RemoteMigrationTransactionUploadStagingResult> {
    throw new Error(
      `Remote migration transaction staging is disabled for ${draftId}.`
    );
  }

  async commitDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult> {
    throw new Error(
      `Remote migration commit is disabled for ${draftId}.`
    );
  }

  async abortDraft(
    draftId: string
  ):
    Promise<void> {
    throw new Error(
      `Remote migration abort is disabled for ${draftId}.`
    );
  }
}
