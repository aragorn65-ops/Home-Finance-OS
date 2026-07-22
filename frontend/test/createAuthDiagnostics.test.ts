import assert from "node:assert/strict";
import test from "node:test";

import {
  findLatestMigrationDraft,
  getMigrationDiagnosticDate,
} from "../src/features/auth/services/createAuthDiagnostics.ts";

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
        committedAt:
          new Date(
            "2026-07-22T05:00:00Z"
          ),
      }).toISOString(),
      "2026-07-22T05:00:00.000Z"
    );
  }
);
