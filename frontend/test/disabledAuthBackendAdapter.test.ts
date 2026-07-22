import assert from "node:assert/strict";
import test from "node:test";

test(
  "disabled auth adapter rejects migration abort",
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
        adapter.abortMigrationDraft(
          "migration-1"
        ),
      /Remote migration abort is disabled for migration-1\./
    );
  }
);
