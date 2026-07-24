import assert from "node:assert/strict";
import test from "node:test";

import {
  assertMigrationCommitResultMatchesDraft,
  requireMigrationCommitLocalLink,
  requireMigrationCommitLocalOwner,
  requireMigrationCommitDraft,
  requireMigrationCommitUploadStaged,
} from "../src/features/auth/components/migrationCheckpointCommit.ts";

function createValidatedDraft(
  overrides: Partial<ReturnType<
    typeof createValidatedDraftBase
  >> = {}
) {
  return {
    ...createValidatedDraftBase(),
    ...overrides,
  };
}

function createValidatedDraftBase() {
  return {
    id:
      "migration-1",
    householdId:
      "household-1",
    householdName:
      "Casa Test",
    ownerMemberId:
      "member-1",
    requestedByUserId:
      "user-1",
    backupSummary: {
      householdName:
        "Casa Test",
      exportedAt:
        "2026-07-22T02:00:00Z",
      accountCount:
        0,
      transactionCount:
        0,
      expenseAllocationCount:
        0,
      settlementCount:
        0,
      settlementApplicationCount:
        0,
      savingsGoalCount:
        0,
      savingsActivityCount:
        0,
      providerBillCount:
        0,
    },
    remoteRecordCount:
      0,
    status:
      "validated" as const,
    createdAt:
      new Date(
        "2026-07-22T02:00:00Z"
      ),
    updatedAt:
      new Date(
        "2026-07-22T03:00:00Z"
      ),
  };
}

test(
  "returns the local migration draft required for commit linking",
  () => {
    const draft =
      createValidatedDraft();

    assert.equal(
      requireMigrationCommitDraft(
        [
          draft,
        ],
        "migration-1"
      ),
      draft
    );
  }
);

test(
  "blocks migration commit when the local draft is not validated",
  () => {
    assert.throws(
      () =>
        requireMigrationCommitDraft(
          [
            createValidatedDraft({
              status:
                "uploaded",
            }),
          ],
          "migration-1"
        ),
      /Validate the migration checkpoint before committing\./
    );
  }
);

test(
  "blocks migration commit when local link metadata is missing",
  () => {
    assert.throws(
      () =>
        requireMigrationCommitDraft(
          [
            createValidatedDraft({
              ownerMemberId:
                "",
            }),
          ],
          "migration-1"
        ),
      /Migration checkpoint is missing local link metadata\. Refresh diagnostics before committing\./
    );
  }
);

test(
  "blocks migration commit when the local draft is missing",
  () => {
    assert.throws(
      () =>
        requireMigrationCommitDraft(
          [],
          "migration-1"
        ),
      /Migration checkpoint is no longer available locally\. Refresh diagnostics before committing\./
    );
  }
);

test(
  "allows migration commit when checkpoint owner exists locally",
  () => {
    assert.doesNotThrow(() => {
      requireMigrationCommitLocalOwner(
        createValidatedDraft({
          ownerMemberId:
            "member-local-owner",
        }),
        [
          "member-local-owner",
          "member-2",
        ]
      );
    });
  }
);

test(
  "blocks migration commit when checkpoint owner is not local",
  () => {
    assert.throws(
      () =>
        requireMigrationCommitLocalOwner(
          createValidatedDraft({
            ownerMemberId:
              "member-remote-owner",
          }),
          [
            "member-local-owner",
          ]
        ),
      /Migration checkpoint owner member is not available locally\. Refresh diagnostics before committing\./
    );
  }
);

test(
  "allows migration commit when local household is not linked",
  () => {
    assert.doesNotThrow(() => {
      requireMigrationCommitLocalLink(
        createValidatedDraft(),
        undefined
      );
    });
  }
);

test(
  "allows migration commit when local link matches checkpoint",
  () => {
    assert.doesNotThrow(() => {
      requireMigrationCommitLocalLink(
        createValidatedDraft(),
        {
          remoteHouseholdId:
            "household-1",
          migrationId:
            "migration-1",
          ownerMemberId:
            "member-1",
          linkedByUserId:
            "user-1",
          linkedAt:
            "2026-07-22T06:00:00.000Z",
        }
      );
    });
  }
);

test(
  "blocks migration commit when local link points elsewhere",
  () => {
    assert.throws(
      () =>
        requireMigrationCommitLocalLink(
          createValidatedDraft(),
          {
            remoteHouseholdId:
              "household-2",
            migrationId:
              "migration-2",
            ownerMemberId:
              "member-1",
            linkedByUserId:
              "user-1",
            linkedAt:
              "2026-07-22T06:00:00.000Z",
          }
        ),
      /Local household is already linked to a different remote checkpoint\. Review the authenticated link before committing\./
    );
  }
);

test(
  "accepts matching remote commit result for local linking",
  () => {
    assert.doesNotThrow(() => {
      assertMigrationCommitResultMatchesDraft(
        createValidatedDraft(),
        {
          householdId:
            "household-1",
          migrationId:
            "migration-1",
          committedAt:
            new Date(
              "2026-07-22T06:00:00Z"
            ),
        }
      );
    });
  }
);

test(
  "blocks migration commit until upload staging is implemented",
  () => {
    assert.throws(
      () =>
        requireMigrationCommitUploadStaged(
          createValidatedDraft()
        ),
      /cannot be committed until full upload staging is implemented and verified\./
    );
  }
);

test(
  "blocks local link when remote commit result does not match the checkpoint",
  () => {
    assert.throws(
      () =>
        assertMigrationCommitResultMatchesDraft(
          createValidatedDraft(),
          {
            householdId:
              "household-2",
            migrationId:
              "migration-1",
            committedAt:
              new Date(
                "2026-07-22T06:00:00Z"
              ),
          }
        ),
      /Remote persistence committed, but the returned household link does not match the local checkpoint\./
    );
  }
);
