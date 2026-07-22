import assert from "node:assert/strict";
import test from "node:test";

import {
  requireMigrationCommitDraft,
} from "../src/features/auth/components/migrationCheckpointCommit.ts";

test(
  "returns the local migration draft required for commit linking",
  () => {
    const draft = {
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
