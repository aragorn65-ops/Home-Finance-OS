import assert from "node:assert/strict";
import test from "node:test";

import {
  createRemoteSettlementApplicationDrafts,
} from "../src/features/settlements/services/settlementRemoteDrafts.ts";

test(
  "remote settlement drafts include local settlement applications",
  () => {
    assert.deepEqual(
      createRemoteSettlementApplicationDrafts(
        [
          {
            id:
              "settlement-application-1",
            settlementId:
              "settlement-1",
            expenseAllocationId:
              "expense-allocation-1",
            appliedAmount: 75,
            createdAt:
              new Date(
                "2026-07-30T01:00:00.000Z"
              ),
            updatedAt:
              new Date(
                "2026-07-30T01:00:00.000Z"
              ),
          },
        ]
      ),
      [
        {
          localRecordId:
            "settlement-application-1",
          expenseAllocationId:
            "expense-allocation-1",
          appliedAmount: 75,
        },
      ]
    );
  }
);
