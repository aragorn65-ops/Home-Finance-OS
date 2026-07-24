import assert from "node:assert/strict";
import test from "node:test";

import {
  installBrowserStorage,
} from "./storageTestUtils.ts";

test(
  "prototype claim creates an uploaded migration draft and commit preserves household id",
  async () => {
    installBrowserStorage();
    const {
      InMemoryAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/inMemoryAuthBackendAdapter.ts"
    );

    const adapter =
      new InMemoryAuthBackendAdapter();
    await adapter.signIn();

    const claim =
      await adapter.createHouseholdClaimDraft({
        householdName:
          "Test Household",
        ownerMemberId:
          "member-owner-1",
        backupSummary: {
          householdName:
            "Test Household",
          exportedAt:
            "2026-07-21T00:00:00.000Z",
          accountCount: 0,
          transactionCount: 0,
          settlementCount: 0,
          savingsGoalCount: 0,
        },
      });
    const drafts =
      await adapter.listMigrationDrafts();

    assert.equal(
      drafts.length,
      1
    );
    assert.equal(
      drafts[0]?.status,
      "uploaded"
    );
    assert.equal(
      drafts[0]?.householdId,
      claim.householdId
    );

    await adapter.validateMigrationDraft(
      claim.migrationDraft.id
    );
    const staging =
      await adapter.stageMigrationUploadManifest(
        claim.migrationDraft.id,
        {
          expectedRecordCount:
            claim.migrationDraft
              .remoteRecordCount,
          counts: [],
        }
      );

    assert.equal(
      staging.stagedRecordCount,
      claim.migrationDraft.remoteRecordCount
    );
    const accountStaging =
      await adapter.stageMigrationAccounts(
        claim.migrationDraft.id,
        {
          expectedAccountCount:
            claim.migrationDraft
              .backupSummary.accountCount,
          accounts: [],
        }
      );

    assert.equal(
      accountStaging.stagedAccountCount,
      claim.migrationDraft
        .backupSummary.accountCount
    );

    const commit =
      await adapter.commitMigrationDraft(
        claim.migrationDraft.id
      );

    assert.equal(
      commit.householdId,
      claim.householdId
    );
  }
);
