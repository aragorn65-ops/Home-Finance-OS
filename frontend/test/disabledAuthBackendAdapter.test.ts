import assert from "node:assert/strict";
import test from "node:test";

test(
  "disabled auth adapter rejects migration lifecycle actions",
  async () => {
    const {
      DisabledAuthBackendAdapter,
    } = await import(
      "../src/features/auth/services/disabledAuthBackendAdapter.ts"
    );

    const adapter =
      new DisabledAuthBackendAdapter();

    await assert.rejects(
      () =>
        adapter.validateMigrationDraft(
          "migration-1"
        ),
      /Remote migration validation is disabled for migration-1\./
    );

    await assert.rejects(
      () =>
        adapter.commitMigrationDraft(
          "migration-1"
        ),
      /Remote migration commit is disabled for migration-1\./
    );

    await assert.rejects(
      () =>
        adapter.stageMigrationUploadManifest(
          "migration-1",
          {
            expectedRecordCount:
              1,
            counts: [],
          }
        ),
      /Remote migration upload staging is disabled for migration-1\./
    );

    await assert.rejects(
      () =>
        adapter.stageMigrationAccounts(
          "migration-1",
          {
            expectedAccountCount:
              0,
            accounts: [],
          }
        ),
      /Remote migration account staging is disabled for migration-1\./
    );

    await assert.rejects(
      () =>
        adapter.stageMigrationTransactions(
          "migration-1",
          {
            expectedTransactionCount:
              0,
            transactions: [],
          }
        ),
      /Remote migration transaction staging is disabled for migration-1\./
    );

    await assert.rejects(
      () =>
        adapter.auditMigrationPreCommit(
          "migration-1"
        ),
      /Remote migration pre-commit audit is disabled for migration-1\./
    );

    await assert.rejects(
      () =>
        adapter.abortMigrationDraft(
          "migration-1"
        ),
      /Remote migration abort is disabled for migration-1\./
    );

    await assert.rejects(
      () =>
        adapter.saveRemoteCoreSnapshot({
          householdId:
            "household-1",
          accounts: [],
          transactions: [],
        }),
      /Remote core household persistence is disabled for household-1\./
    );

    await assert.rejects(
      () =>
        adapter.loadRemoteHousehold(
          "household-1"
        ),
      /Remote household persistence is disabled for household-1\./
    );

    await assert.rejects(
      () =>
        adapter.saveRemoteHouseholdPreferences({
          householdId:
            "household-1",
          name:
            "Home",
          country:
            "PH",
          currency:
            "PHP",
          timezone:
            "Asia/Manila",
        }),
      /Remote household persistence is disabled for household-1\./
    );
  }
);
