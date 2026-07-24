import assert from "node:assert/strict";
import test from "node:test";

import {
  createAuthDiagnosticsForAdapter,
  createPostCommitSmokeChecks,
  createProductionAuthReadinessChecks,
  findLatestMigrationDraft,
  getMigrationDiagnosticDate,
} from "../src/features/auth/services/createAuthDiagnostics.ts";

test(
  "auth diagnostics skip user-dependent reads while signed out",
  async () => {
    const diagnostics =
      await createAuthDiagnosticsForAdapter(
        {
          async getSession() {
            return {
              status:
                "signed-out",
            };
          },
          async signIn() {
            return {
              status:
                "signed-out",
            };
          },
          async signOut() {
            return undefined;
          },
          async getCurrentUser() {
            throw new Error(
              "not expected"
            );
          },
          async listMemberships() {
            throw new Error(
              "not expected"
            );
          },
          async listInvitations() {
            throw new Error(
              "not expected"
            );
          },
          async createHouseholdClaimDraft() {
            throw new Error(
              "not expected"
            );
          },
          async listMigrationDrafts() {
            throw new Error(
              "not expected"
            );
          },
          async validateMigrationDraft() {
            throw new Error(
              "not expected"
            );
          },
          async stageMigrationUploadManifest() {
            throw new Error(
              "not expected"
            );
          },
          async stageMigrationAccounts() {
            throw new Error(
              "not expected"
            );
          },
          async stageMigrationTransactions() {
            throw new Error(
              "not expected"
            );
          },
          async auditMigrationPreCommit() {
            throw new Error(
              "not expected"
            );
          },
          async commitMigrationDraft() {
            throw new Error(
              "not expected"
            );
          },
          async abortMigrationDraft() {
            throw new Error(
              "not expected"
            );
          },
        },
        {
          enabled: true,
          provider: "supabase",
        }
      );

    assert.equal(
      diagnostics.sessionStatus,
      "signed-out"
    );
    assert.deepEqual(
      diagnostics.warnings,
      []
    );
    assert.equal(
      diagnostics.membershipCount,
      0
    );
    assert.equal(
      diagnostics.migrationDraftCount,
      0
    );
  }
);

test(
  "production auth readiness passes the configured Supabase baseline",
  () => {
    const checks =
      createProductionAuthReadinessChecks(
        {
          config: {
            enabled: true,
            provider: "supabase",
          },
          sessionStatus:
            "signed-in",
          isSupabaseAdapter: true,
          isSupabaseConfigured:
            true,
          membershipCount: 1,
          warningCount: 0,
        }
      );

    assert.deepEqual(
      checks.map((check) => [
        check.id,
        check.status,
      ]),
      [
        ["provider", "pass"],
        ["env", "pass"],
        ["session", "pass"],
        ["membership", "pass"],
        ["diagnostics", "pass"],
        ["sync-boundary", "pass"],
      ]
    );
  }
);

test(
  "production auth readiness blocks missing Supabase environment",
  () => {
    const checks =
      createProductionAuthReadinessChecks(
        {
          config: {
            enabled: true,
            provider: "supabase",
          },
          sessionStatus:
            "signed-out",
          isSupabaseAdapter: true,
          isSupabaseConfigured:
            false,
          membershipCount: 0,
          warningCount: 1,
        }
      );

    assert.equal(
      checks.find(
        (check) =>
          check.id === "env"
      )?.status,
      "blocked"
    );

    assert.equal(
      checks.find(
        (check) =>
          check.id ===
          "diagnostics"
      )?.status,
      "blocked"
    );

    assert.equal(
      checks.find(
        (check) =>
          check.id ===
          "sync-boundary"
      )?.status,
      "pass"
    );
  }
);

test(
  "post-commit smoke checks pass for readable committed remote data",
  () => {
    const checks =
      createPostCommitSmokeChecks({
        latestMigration:
          createCommittedMigrationDraft(),
        householdDiagnostics: [
          {
            householdId:
              "household-1",
            householdName:
              "Team Avatar",
          },
        ],
        accountSummary: {
          totalCount:
            7,
          activeCount:
            6,
          inactiveCount:
            1,
          householdVisibleCount:
            0,
          privateVisibleCount:
            7,
          assetCount:
            5,
          liabilityCount:
            2,
          currencies: [
            "PHP",
            "USD",
          ],
        },
        transactionSummary: {
          totalCount:
            32,
          activeCount:
            32,
          inactiveCount:
            0,
          incomeCount:
            0,
          expenseCount:
            30,
          transferCount:
            2,
          householdVisibleCount:
            22,
          participantVisibleCount:
            8,
          privateVisibleCount:
            0,
          sourceAccountLinkedCount:
            31,
          destinationAccountLinkedCount:
            2,
          missingAccountLinkCount:
            0,
          expenseMissingSourceAccountCount:
            0,
          earliestTransactionDate:
            "2026-05-31",
          latestTransactionDate:
            "2026-07-21",
        },
      });

    assert.deepEqual(
      checks.map((check) => [
        check.id,
        check.status,
      ]),
      [
        [
          "committed-checkpoint",
          "pass",
        ],
        [
          "remote-household-read",
          "pass",
        ],
        [
          "remote-account-count",
          "pass",
        ],
        [
          "remote-transaction-count",
          "pass",
        ],
        [
          "remote-transaction-links",
          "pass",
        ],
        [
          "sync-boundary",
          "pass",
        ],
      ]
    );
  }
);

test(
  "post-commit smoke checks wait for a committed checkpoint",
  () => {
    const checks =
      createPostCommitSmokeChecks({
        latestMigration: {
          ...createCommittedMigrationDraft(),
          status:
            "validated",
          committedAt:
            undefined,
        },
        householdDiagnostics: [],
        accountSummary:
          undefined,
        transactionSummary:
          undefined,
      });

    assert.deepEqual(
      checks.map((check) => [
        check.id,
        check.status,
      ]),
      [
        [
          "committed-checkpoint",
          "action",
        ],
      ]
    );
  }
);

test(
  "finds latest migration draft by lifecycle timestamp",
  () => {
    const olderCommittedDraft = {
      id:
        "migration-committed",
      status:
        "committed",
      updatedAt:
        new Date(
          "2026-07-22T05:00:00Z"
        ),
      committedAt:
        new Date(
          "2026-07-22T05:00:00Z"
        ),
    };
    const newerAbortedDraft = {
      id:
        "migration-aborted",
      status:
        "aborted",
      updatedAt:
        new Date(
          "2026-07-22T04:00:00Z"
        ),
      abortedAt:
        new Date(
          "2026-07-22T06:00:00Z"
        ),
    };

    assert.equal(
      findLatestMigrationDraft([
        newerAbortedDraft,
        olderCommittedDraft,
      ])?.id,
      "migration-aborted"
    );
  }
);

function createCommittedMigrationDraft() {
  return {
    id:
      "migration-1",
    householdId:
      "household-1",
    householdName:
      "Team Avatar",
    ownerMemberId:
      "member-1",
    requestedByUserId:
      "user-1",
    backupSummary: {
      householdName:
        "Team Avatar",
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
      "committed" as const,
    createdAt:
      new Date(
        "2026-07-24T00:00:00Z"
      ),
    updatedAt:
      new Date(
        "2026-07-24T07:03:46Z"
      ),
    committedAt:
      new Date(
        "2026-07-24T07:03:46Z"
      ),
  };
}

test(
  "finds staged migration drafts newer than validated drafts",
  () => {
    const stagedDraft = {
      id:
        "migration-staged",
      status:
        "validated",
      updatedAt:
        new Date(
          "2026-07-22T03:00:00Z"
        ),
      validatedAt:
        new Date(
          "2026-07-22T04:00:00Z"
        ),
      uploadStagedAt:
        new Date(
          "2026-07-22T04:30:00Z"
        ),
      accountUploadStagedAt:
        new Date(
          "2026-07-22T04:45:00Z"
        ),
      transactionUploadStagedAt:
        new Date(
          "2026-07-22T04:50:00Z"
        ),
    };
    const validatedDraft = {
      id:
        "migration-validated",
      status:
        "validated",
      updatedAt:
        new Date(
          "2026-07-22T04:15:00Z"
        ),
      validatedAt:
        new Date(
          "2026-07-22T04:15:00Z"
        ),
    };

    assert.equal(
      findLatestMigrationDraft([
        validatedDraft,
        stagedDraft,
      ])?.id,
      "migration-staged"
    );
  }
);

test(
  "migration diagnostic date prefers lifecycle dates over update date",
  () => {
    assert.equal(
      getMigrationDiagnosticDate({
        updatedAt:
          new Date(
            "2026-07-22T03:00:00Z"
          ),
        validatedAt:
          new Date(
            "2026-07-22T04:00:00Z"
          ),
        uploadStagedAt:
          new Date(
            "2026-07-22T04:30:00Z"
          ),
        committedAt:
          new Date(
            "2026-07-22T05:00:00Z"
          ),
      }).toISOString(),
      "2026-07-22T05:00:00.000Z"
    );
  }
);
