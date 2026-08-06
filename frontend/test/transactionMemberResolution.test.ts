import assert from "node:assert/strict";
import test from "node:test";

import type {
  ExpenseAllocation,
} from "../src/features/transactions/models/ExpenseAllocation.ts";
import type {
  Transaction,
} from "../src/features/transactions/models/Transaction.ts";
import resolveTransactionMemberId from "../src/features/transactions/services/transactionMemberResolution.ts";

const baseTransaction: Transaction = {
  id: "transaction-1",
  householdId: "household-1",
  type: "expense",
  amount: 100,
  sourceAccountId: null,
  destinationAccountId: null,
  category: "Groceries",
  description: "Groceries",
  notes: "",
  transactionDate:
    new Date("2026-08-01T00:00:00Z"),
  createdAt:
    new Date("2026-08-01T00:00:00Z"),
  updatedAt:
    new Date("2026-08-01T00:00:00Z"),
};

const baseAllocation: ExpenseAllocation = {
  id: "allocation-1",
  transactionId: "transaction-1",
  paidByMemberId: "member-from-allocation",
  memberId: "member-owed",
  isIncluded: true,
  allocatedAmount: 100,
  createdAt:
    new Date("2026-08-01T00:00:00Z"),
  updatedAt:
    new Date("2026-08-01T00:00:00Z"),
};

test(
  "transaction member resolution prefers the selected paid-by member",
  () => {
    assert.equal(
      resolveTransactionMemberId(
        {
          ...baseTransaction,
          paidByMemberId:
            "member-paid-by",
          createdByMemberId:
            "member-created-by",
        },
        [
          baseAllocation,
        ]
      ),
      "member-paid-by"
    );
  }
);

test(
  "transaction member resolution falls back to created-by member",
  () => {
    assert.equal(
      resolveTransactionMemberId(
        {
          ...baseTransaction,
          createdByMemberId:
            "member-created-by",
        },
        [
          baseAllocation,
        ]
      ),
      "member-created-by"
    );
  }
);

test(
  "transaction member resolution recovers legacy expense payer from allocations",
  () => {
    assert.equal(
      resolveTransactionMemberId(
        baseTransaction,
        [
          baseAllocation,
        ]
      ),
      "member-from-allocation"
    );
  }
);
