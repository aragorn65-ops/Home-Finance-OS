import assert from "node:assert/strict";
import test from "node:test";

import {
  requireMigrationAbortDraft,
  requireMigrationUploadStagingDraft,
  requireMigrationValidateDraft,
} from "../src/features/auth/components/migrationCheckpointActionGuards.ts";
import type {
  RemoteMigrationDraft,
} from "../src/features/auth/models/RemoteMigration.ts";

function createDraft(
  status: RemoteMigrationDraft["status"] =
    "uploaded"
): RemoteMigrationDraft {
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
    status,
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
  "allows validation for uploaded local checkpoints",
  () => {
    const draft =
      createDraft();

    assert.equal(
      requireMigrationValidateDraft(
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
  "blocks validation for non-uploaded local checkpoints",
  () => {
    assert.throws(
      () =>
        requireMigrationValidateDraft(
          [
            createDraft(
              "validated"
            ),
          ],
          "migration-1"
        ),
      /Only uploaded migration checkpoints can be validated\./
    );
  }
);

test(
  "allows abort for non-final local checkpoints",
  () => {
    const draft =
      createDraft(
        "validated"
      );

    assert.equal(
      requireMigrationAbortDraft(
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
  "allows upload staging for validated local checkpoints",
  () => {
    const draft =
      createDraft(
        "validated"
      );

    assert.equal(
      requireMigrationUploadStagingDraft(
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
  "blocks upload staging before validation",
  () => {
    assert.throws(
      () =>
        requireMigrationUploadStagingDraft(
          [
            createDraft(),
          ],
          "migration-1"
        ),
      /Validate the migration checkpoint before staging upload metadata\./
    );
  }
);

test(
  "blocks abort for final local checkpoints",
  () => {
    assert.throws(
      () =>
        requireMigrationAbortDraft(
          [
            createDraft(
              "committed"
            ),
          ],
          "migration-1"
        ),
      /Final migration checkpoints cannot be aborted\./
    );
  }
);

test(
  "blocks actions when the local checkpoint is missing",
  () => {
    assert.throws(
      () =>
        requireMigrationAbortDraft(
          [],
          "migration-1"
        ),
      /Migration checkpoint is no longer available locally\. Refresh diagnostics before continuing\./
    );
  }
);
