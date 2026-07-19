import type {
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationValidation,
} from "../models";
import type {
  HouseholdClaimDraft,
} from "./AuthBackendAdapter";
import {
  createId,
  InMemoryAuthStore,
} from "./inMemoryAuthStore";
import type {
  RemoteMigrationRepository,
} from "./RemoteMigrationRepository";

export class InMemoryRemoteMigrationRepository
  implements RemoteMigrationRepository
{
  private readonly store:
    InMemoryAuthStore;

  constructor(
    store: InMemoryAuthStore
  ) {
    this.store = store;
  }

  async createDraft(
    draft: HouseholdClaimDraft
  ): Promise<RemoteMigrationDraft> {
    const user =
      this.store.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before creating a migration draft."
      );
    }

    const now = new Date();

    return this.store.saveMigration({
      id:
        createId("migration"),
      householdName:
        draft.householdName,
      ownerMemberId:
        draft.ownerMemberId,
      requestedByUserId:
        user.id,
      backupSummary:
        draft.backupSummary,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  }

  async validateDraft(
    draftId: string
  ): Promise<RemoteMigrationValidation> {
    const draft =
      this.store.getMigration(
        draftId
      );

    if (!draft) {
      return {
        draftId,
        isValid: false,
        recordCountsMatch: false,
        warnings: [],
        blockers: [
          "Migration draft was not found.",
        ],
      };
    }

    this.store.updateMigrationStatus(
      draftId,
      "validated"
    );

    return {
      draftId,
      isValid: true,
      recordCountsMatch: true,
      warnings: [],
      blockers: [],
    };
  }

  async commitDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult> {
    const draft =
      this.store.updateMigrationStatus(
        draftId,
        "committed"
      );

    if (!draft) {
      throw new Error(
        "Migration draft was not found."
      );
    }

    return {
      householdId:
        createId("household"),
      migrationId:
        draft.id,
      committedAt:
        new Date(),
    };
  }

  async abortDraft(
    draftId: string
  ): Promise<void> {
    this.store.updateMigrationStatus(
      draftId,
      "aborted"
    );
  }
}
