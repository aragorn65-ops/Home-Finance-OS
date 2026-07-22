import assert from "node:assert/strict";
import test from "node:test";

import {
  formatMigrationCheckpointDate,
  getMigrationCheckpointLifecycleEntries,
  sortMigrationCheckpointDrafts,
} from "../src/features/auth/components/migrationCheckpointLifecycle.ts";

test(
  "formats migration checkpoint timestamps as UTC diagnostics",
  () => {
    assert.equal(
      formatMigrationCheckpointDate(
        new Date(
          "2026-07-22T04:00:00Z"
        )
      ),
      "2026-07-22 04:00:00Z"
    );
  }
);

test(
  "returns only present migration checkpoint lifecycle timestamps",
  () => {
    const entries =
      getMigrationCheckpointLifecycleEntries({
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
          "committed",
        createdAt:
          new Date(
            "2026-07-22T02:00:00Z"
          ),
        updatedAt:
          new Date(
            "2026-07-22T05:00:00Z"
          ),
        validatedAt:
          new Date(
            "2026-07-22T04:00:00Z"
          ),
        committedAt:
          new Date(
            "2026-07-22T05:00:00Z"
          ),
      });

    assert.deepEqual(
      entries,
      [
        {
          label:
            "Validated",
          value:
            "2026-07-22 04:00:00Z",
        },
        {
          label:
            "Committed",
          value:
            "2026-07-22 05:00:00Z",
        },
      ]
    );
  }
);

test(
  "sorts migration checkpoints by newest lifecycle activity first",
  () => {
    const createDraft =
      (
        id: string,
        dates: {
          updatedAt: string;
          validatedAt?: string;
          committedAt?: string;
          abortedAt?: string;
        }
      ) => ({
        id,
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
            dates.updatedAt,
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
          "uploaded" as const,
        createdAt:
          new Date(
            dates.updatedAt
          ),
        updatedAt:
          new Date(
            dates.updatedAt
          ),
        validatedAt:
          dates.validatedAt
            ? new Date(
              dates.validatedAt
            )
            : undefined,
        committedAt:
          dates.committedAt
            ? new Date(
              dates.committedAt
            )
            : undefined,
        abortedAt:
          dates.abortedAt
            ? new Date(
              dates.abortedAt
            )
            : undefined,
      });

    const sorted =
      sortMigrationCheckpointDrafts([
        createDraft(
          "migration-old",
          {
            updatedAt:
              "2026-07-22T02:00:00Z",
          }
        ),
        createDraft(
          "migration-validated",
          {
            updatedAt:
              "2026-07-22T03:00:00Z",
            validatedAt:
              "2026-07-22T04:00:00Z",
          }
        ),
        createDraft(
          "migration-aborted",
          {
            updatedAt:
              "2026-07-22T01:00:00Z",
            abortedAt:
              "2026-07-22T05:00:00Z",
          }
        ),
      ]);

    assert.deepEqual(
      sorted.map((draft) => draft.id),
      [
        "migration-aborted",
        "migration-validated",
        "migration-old",
      ]
    );
  }
);
