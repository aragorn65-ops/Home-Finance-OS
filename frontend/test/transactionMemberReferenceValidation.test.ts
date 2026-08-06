import assert from "node:assert/strict";
import test from "node:test";

import {
  saveHouseholdMembers,
} from "../src/features/household/services/householdStorage.ts";
import TransactionService from "../src/features/transactions/services/TransactionService.ts";
import type {
  TransactionForm,
} from "../src/features/transactions/models/TransactionForm.ts";
import {
  defaultTransactionForm,
} from "../src/features/transactions/models/TransactionForm.ts";
import {
  HFOS_STORAGE_KEYS,
  saveStoredData,
} from "../src/shared/storage/localStorageStore.ts";
import {
  installBrowserStorage,
} from "./storageTestUtils.ts";

const householdId =
  "household-transaction-members";
const payerMemberId = "member-payer";
const participantMemberId =
  "member-participant";

function seedHousehold() {
  installBrowserStorage();

  const now =
    new Date("2026-08-06T00:00:00Z");

  saveStoredData(
    HFOS_STORAGE_KEYS.household,
    {
      id: householdId,
      householdName:
        "Transaction Members",
      country: "PH",
      currency: "PHP",
      timezone: "Asia/Manila",
      members: [
        {
          id: payerMemberId,
          householdId,
          displayName: "Payer",
          role: "owner",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: participantMemberId,
          householdId,
          displayName:
            "Former Participant",
          role: "member",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    }
  );

  for (const key of [
    HFOS_STORAGE_KEYS.accounts,
    HFOS_STORAGE_KEYS.transactions,
    HFOS_STORAGE_KEYS.expenseAllocations,
    HFOS_STORAGE_KEYS.settlements,
    HFOS_STORAGE_KEYS.settlementApplications,
  ]) {
    saveStoredData(
      key,
      []
    );
  }
}

function createSplitExpenseForm():
  TransactionForm {
  return {
    ...defaultTransactionForm,
    type: "expense",
    amount: 100,
    enteredAmount: 100,
    enteredCurrency: "PHP",
    baseAmount: 100,
    exchangeRate: 1,
    paidByMemberId:
      payerMemberId,
    category: "Groceries",
    description: "Groceries",
    transactionDate:
      "2026-08-06",
    splitMethod: "exact",
    allocations: [
      {
        memberId:
          payerMemberId,
        isIncluded: true,
        allocatedAmount: 50,
        personalAmount: 0,
        personalItems: [],
        notes: "",
      },
      {
        memberId:
          participantMemberId,
        isIncluded: true,
        allocatedAmount: 50,
        personalAmount: 0,
        personalItems: [],
        notes: "",
      },
    ],
  };
}

test(
  "transaction create requires active expense participants",
  () => {
    seedHousehold();

    saveHouseholdMembers([
      {
        id: payerMemberId,
        householdId,
        displayName: "Payer",
        role: "owner",
        isActive: true,
        createdAt:
          new Date("2026-08-06T00:00:00Z"),
        updatedAt:
          new Date("2026-08-06T00:00:00Z"),
      },
      {
        id: participantMemberId,
        householdId,
        displayName:
          "Former Participant",
        role: "member",
        isActive: false,
        createdAt:
          new Date("2026-08-06T00:00:00Z"),
        updatedAt:
          new Date("2026-08-06T00:00:00Z"),
      },
    ]);

    const result =
      TransactionService.create(
        createSplitExpenseForm(),
        householdId
      );

    assert.equal(
      result.success,
      false
    );
    assert.equal(
      result.errors?.allocations,
      "Every expense participant must be an active member of this household."
    );
  }
);

test(
  "transaction update preserves historical inactive expense participants",
  () => {
    seedHousehold();

    const createResult =
      TransactionService.create(
        createSplitExpenseForm(),
        householdId
      );

    assert.equal(
      createResult.success,
      true
    );

    saveHouseholdMembers([
      {
        id: payerMemberId,
        householdId,
        displayName: "Payer",
        role: "owner",
        isActive: true,
        createdAt:
          new Date("2026-08-06T00:00:00Z"),
        updatedAt:
          new Date("2026-08-06T00:00:00Z"),
      },
      {
        id: participantMemberId,
        householdId,
        displayName:
          "Former Participant",
        role: "member",
        isActive: false,
        createdAt:
          new Date("2026-08-06T00:00:00Z"),
        updatedAt:
          new Date("2026-08-06T00:00:00Z"),
      },
    ]);

    const updateResult =
      TransactionService.update(
        createResult.data.id,
        {
          ...createSplitExpenseForm(),
          description:
            "Updated groceries",
        }
      );

    assert.equal(
      updateResult.success,
      true
    );
    assert.equal(
      updateResult.data.description,
      "Updated groceries"
    );
  }
);
