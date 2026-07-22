import type {
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
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
