import assert from "node:assert/strict";
import test from "node:test";

import {
  createMigrationUploadManifest,
  createMigrationUploadDryRunContract,
} from "../src/features/auth/components/migrationUploadDryRun.ts";
import type {
  RemoteMigrationDraft,
} from "../src/features/auth/models/RemoteMigration.ts";
import type {
  ApplicationDataHealthSummary,
} from "../src/features/startup/services/applicationBackup.ts";

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
        2,
      transactionCount:
        3,
      expenseAllocationCount:
        4,
      settlementCount:
        1,
      settlementApplicationCount:
        1,
      savingsGoalCount:
        1,
      savingsActivityCount:
        2,
      providerBillCount:
        1,
    },
    remoteRecordCount:
      16,
    status:
      "uploaded",
    createdAt:
      new Date(
        "2026-07-24T00:00:00Z"
      ),
    updatedAt:
      new Date(
        "2026-07-24T01:00:00Z"
      ),
    ...overrides,
  };
}

function createHealthSummary(
  overrides: Partial<ApplicationDataHealthSummary> = {}
): ApplicationDataHealthSummary {
  return {
    householdName:
      "Casa Test",
    authenticatedLinkStatus:
      "unlinked",
    storageSchemaVersion:
      1,
    themePreference:
      "system",
    accountCount:
      2,
    transactionCount:
      3,
    expenseAllocationCount:
      4,
    settlementCount:
      1,
    settlementApplicationCount:
      1,
    savingsGoalCount:
      1,
    savingsActivityCount:
      2,
    providerBillCount:
      1,
    isExportable:
      true,
    message:
      "Ready.",
    ...overrides,
  };
}

test(
  "migration upload dry-run passes when local counts match the checkpoint",
  () => {
    const contract =
      createMigrationUploadDryRunContract(
        createDraft(),
        createHealthSummary()
      );

    assert.equal(
      contract.recordCountsMatch,
      true
    );
    assert.equal(
      contract.checkpointRecordCount,
      16
    );
    assert.equal(
      contract.currentRecordCount,
      16
    );
    assert.deepEqual(
      contract.blockers,
      []
    );
  }
);

test(
  "migration upload dry-run blocks when local data changed after checkpoint upload",
  () => {
    const contract =
      createMigrationUploadDryRunContract(
        createDraft(),
        createHealthSummary({
          transactionCount:
            4,
        })
      );

    assert.equal(
      contract.recordCountsMatch,
      false
    );
    assert.deepEqual(
      contract.blockers,
      [
        "Transactions changed from 3 to 4.",
      ]
    );
  }
);

test(
  "migration upload dry-run blocks inconsistent checkpoint record totals",
  () => {
    const contract =
      createMigrationUploadDryRunContract(
        createDraft({
          remoteRecordCount:
            15,
        }),
        createHealthSummary()
      );

    assert.equal(
      contract.recordCountsMatch,
      false
    );
    assert.deepEqual(
      contract.blockers,
      [
        "Checkpoint staged 15 records, but its backup summary contains 16.",
      ]
    );
  }
);

test(
  "creates an upload manifest from the dry-run contract",
  () => {
    const contract =
      createMigrationUploadDryRunContract(
        createDraft(),
        createHealthSummary()
      );

    assert.deepEqual(
      createMigrationUploadManifest(
        contract
      ),
      {
        expectedRecordCount:
          16,
        counts: [
          {
            id: "household",
            label: "Household",
            count: 1,
          },
          {
            id: "accounts",
            label: "Accounts",
            count: 2,
          },
          {
            id: "transactions",
            label: "Transactions",
            count: 3,
          },
          {
            id:
              "expense-allocations",
            label:
              "Expense allocations",
            count: 4,
          },
          {
            id: "settlements",
            label: "Settlements",
            count: 1,
          },
          {
            id:
              "settlement-applications",
            label:
              "Settlement applications",
            count: 1,
          },
          {
            id: "savings-goals",
            label: "Savings goals",
            count: 1,
          },
          {
            id:
              "savings-activities",
            label:
              "Savings activities",
            count: 2,
          },
          {
            id: "provider-bills",
            label: "Provider bills",
            count: 1,
          },
        ],
      }
    );
  }
);
