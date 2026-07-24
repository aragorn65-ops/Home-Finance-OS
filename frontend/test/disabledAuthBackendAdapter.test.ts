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
        adapter.abortMigrationDraft(
          "migration-1"
        ),
      /Remote migration abort is disabled for migration-1\./
    );
  }
);
