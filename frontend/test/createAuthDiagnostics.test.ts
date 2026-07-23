import assert from "node:assert/strict";
import test from "node:test";

import {
  createProductionAuthReadinessChecks,
  findLatestMigrationDraft,
  getMigrationDiagnosticDate,
} from "../src/features/auth/services/createAuthDiagnostics.ts";

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
