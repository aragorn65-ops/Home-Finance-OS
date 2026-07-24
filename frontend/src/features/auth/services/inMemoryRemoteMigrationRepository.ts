import type {
  RemoteMigrationAccountUploadPayload,
  RemoteMigrationAccountUploadStagingResult,
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationUploadManifest,
  RemoteMigrationUploadStagingResult,
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

  async listDrafts():
    Promise<RemoteMigrationDraft[]> {
    return this.store.listMigrations();
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
      householdId:
        draft.claimedHouseholdId ??
        createId("household"),
      householdName:
        draft.householdName,
      ownerMemberId:
        draft.ownerMemberId,
      requestedByUserId:
        user.id,
      backupSummary:
        draft.backupSummary,
      remoteRecordCount:
        countRemoteMigrationRecords(
          draft.backupSummary
        ),
      status: "uploaded",
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

    this.store.saveMigration({
      ...draft,
      status: "validated",
      validatedAt:
        new Date(),
      updatedAt:
        new Date(),
    });

    return {
      draftId,
      isValid: true,
      recordCountsMatch: true,
      warnings: [],
      blockers: [],
    };
  }

  async stageUploadManifest(
    draftId: string,
    manifest: RemoteMigrationUploadManifest
  ): Promise<RemoteMigrationUploadStagingResult> {
    const draft =
      this.store.getMigration(
        draftId
      );

    if (!draft) {
      throw new Error(
        "Migration draft was not found."
      );
    }

    if (draft.status !== "validated") {
      throw new Error(
        "Validate the migration draft before staging upload."
      );
    }

    if (
      manifest.expectedRecordCount !==
      draft.remoteRecordCount
    ) {
      throw new Error(
        "Upload manifest count does not match the migration checkpoint."
      );
    }

    const stagedAt =
      new Date();

    this.store.saveMigration({
      ...draft,
      uploadStagedAt:
        stagedAt,
      uploadStagedRecordCount:
        manifest.expectedRecordCount,
      updatedAt:
        stagedAt,
    });

    return {
      draftId,
      stagedRecordCount:
        manifest.expectedRecordCount,
      stagedAt,
    };
  }

  async stageAccounts(
    draftId: string,
    payload: RemoteMigrationAccountUploadPayload
  ): Promise<RemoteMigrationAccountUploadStagingResult> {
    const draft =
      this.store.getMigration(
        draftId
      );

    if (!draft) {
      throw new Error(
        "Migration draft was not found."
      );
    }

    if (!draft.uploadStagedAt) {
      throw new Error(
        "Stage the migration upload manifest before staging accounts."
      );
    }

    if (
      payload.expectedAccountCount !==
        draft.backupSummary.accountCount ||
      payload.accounts.length !==
        payload.expectedAccountCount
    ) {
      throw new Error(
        "Account upload payload does not match the migration checkpoint."
      );
    }

    const stagedAt =
      new Date();

    this.store.saveMigration({
      ...draft,
      accountUploadStagedAt:
        stagedAt,
      accountUploadStagedCount:
        payload.expectedAccountCount,
      updatedAt:
        stagedAt,
    });

    return {
      draftId,
      stagedAccountCount:
        payload.expectedAccountCount,
      stagedAt,
    };
  }

  async commitDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult> {
    const draft =
      this.store.getMigration(
        draftId
      );

    if (!draft) {
      throw new Error(
        "Migration draft was not found."
      );
    }

    if (
      draft.status !== "validated" &&
      draft.status !== "committed"
    ) {
      throw new Error(
        "Validate the migration draft before committing it."
      );
    }

    const committedAt =
      new Date();

    this.store.saveMigration({
      ...draft,
      status: "committed",
      committedAt,
      updatedAt:
        committedAt,
    });

    return {
      householdId:
        draft.householdId,
      migrationId:
        draft.id,
      committedAt:
        committedAt,
    };
  }

  async abortDraft(
    draftId: string
  ): Promise<void> {
    const draft =
      this.store.getMigration(
        draftId
      );

    if (!draft) {
      return;
    }

    const abortedAt =
      new Date();

    this.store.saveMigration({
      ...draft,
      status: "aborted",
      abortedAt,
      updatedAt:
        abortedAt,
    });
  }
}

function countRemoteMigrationRecords(
  summary: HouseholdClaimDraft["backupSummary"]
): number {
  const counts: number[] = [
    summary.accountCount ?? 0,
    summary.transactionCount ?? 0,
    summary.expenseAllocationCount ?? 0,
    summary.settlementCount ?? 0,
    summary.settlementApplicationCount ?? 0,
    summary.savingsGoalCount ?? 0,
    summary.savingsActivityCount ?? 0,
    summary.providerBillCount ?? 0,
  ];

  return counts.reduce(
    (total, count) => total + count,
    1
  );
}
