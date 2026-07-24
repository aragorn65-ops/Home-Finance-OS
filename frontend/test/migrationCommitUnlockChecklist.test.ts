import assert from "node:assert/strict";
import test from "node:test";

import {
  createMigrationCommitUnlockChecklist,
} from "../src/features/auth/components/migrationCommitUnlockChecklist.ts";
import type {
  RemoteMigrationDraft,
  RemoteMigrationPreCommitAudit,
} from "../src/features/auth/models/RemoteMigration.ts";
import type {
  MigrationUploadDryRunContract,
} from "../src/features/auth/components/migrationUploadDryRun.ts";

function createDraft(
  overrides: Partial<RemoteMigrationDraft> = {}
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
        "2026-07-24T00:00:00Z",
      accountCount:
        7,
      transactionCount:
        32,
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
      40,
    status:
      "validated",
    createdAt:
      new Date(
        "2026-07-24T00:00:00Z"
      ),
    updatedAt:
      new Date(
        "2026-07-24T01:00:00Z"
      ),
    uploadStagedAt:
      new Date(
        "2026-07-24T02:00:00Z"
      ),
    uploadStagedRecordCount:
      40,
    accountUploadStagedAt:
      new Date(
        "2026-07-24T03:00:00Z"
      ),
    accountUploadStagedCount:
      7,
    transactionUploadStagedAt:
      new Date(
        "2026-07-24T04:00:00Z"
      ),
    transactionUploadStagedCount:
      32,
    ...overrides,
  };
}

function createDryRunContract(
  overrides: Partial<MigrationUploadDryRunContract> = {}
): MigrationUploadDryRunContract {
  return {
    draftId:
      "migration-1",
    recordCountsMatch:
      true,
    checkpointRecordCount:
      40,
    currentRecordCount:
      40,
    counts: [],
    blockers: [],
    ...overrides,
  };
}

function createAudit(
  overrides: Partial<RemoteMigrationPreCommitAudit> = {}
): RemoteMigrationPreCommitAudit {
  return {
    draftId:
      "migration-1",
    isReady:
      true,
    blockerCount:
      0,
    warningCount:
      0,
    blockers: [],
    warnings: [],
    accountCount:
      7,
    transactionCount:
      32,
    missingExpenseSourceAccountCount:
      0,
    missingTransactionAccountLinkCount:
      0,
    auditedAt:
      new Date(
        "2026-07-24T05:00:00Z"
      ),
    ...overrides,
  };
}

test(
  "commit unlock checklist is ready for review when all gates pass but commit stays locked",
  () => {
    const checklist =
      createMigrationCommitUnlockChecklist(
        createDraft(),
        createDryRunContract(),
        createAudit()
      );

    assert.equal(
      checklist.isReadyForUnlockReview,
      true
    );
    assert.deepEqual(
      checklist.items.map(
        (item) => item.status
      ),
      [
        "pass",
        "pass",
        "pass",
        "pass",
        "pass",
        "locked",
      ]
    );
  }
);

test(
  "commit unlock checklist asks for audit before unlock review",
  () => {
    const checklist =
      createMigrationCommitUnlockChecklist(
        createDraft(),
        createDryRunContract()
      );

    assert.equal(
      checklist.isReadyForUnlockReview,
      false
    );
    assert.equal(
      checklist.items.find(
        (item) =>
          item.id === "pre-commit-audit"
      )?.status,
      "action-needed"
    );
  }
);

test(
  "commit unlock checklist blocks when pre-commit audit counts drift",
  () => {
    const checklist =
      createMigrationCommitUnlockChecklist(
        createDraft(),
        createDryRunContract(),
        createAudit({
          transactionCount:
            31,
        })
      );

    assert.equal(
      checklist.isReadyForUnlockReview,
      false
    );
    assert.equal(
      checklist.items.find(
        (item) =>
          item.id === "pre-commit-audit"
      )?.status,
      "blocked"
    );
  }
);
