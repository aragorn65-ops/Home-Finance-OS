import assert from "node:assert/strict";
import test from "node:test";

import {
  saveHouseholdMembers,
} from "../src/features/household/services/householdStorage.ts";
import TransactionService from "../src/features/transactions/services/TransactionService.ts";
import type {
  Transaction,
} from "../src/features/transactions/models/Transaction.ts";
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
const uninvolvedMemberId =
  "member-uninvolved";

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
          id: uninvolvedMemberId,
          householdId,
          displayName:
            "Uninvolved Member",
          role: "member",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: participantMemberId,
          householdId,
          email:
            "rasha@example.com",
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

function createTransaction(
  overrides: Partial<Transaction>
): Transaction {
  const now =
    new Date("2026-08-06T00:00:00Z");

  return {
    id: "transaction-1",
    householdId,
    createdByMemberId:
      payerMemberId,
    paidByMemberId:
      payerMemberId,
    visibility: "household",
    type: "expense",
    amount: 100,
    enteredAmount: 100,
    enteredCurrency: "PHP",
    baseCurrency: "PHP",
    baseAmount: 100,
    exchangeRate: 1,
    exchangeRateSource: "manual",
    sourceAccountId: null,
    destinationAccountId: null,
    category: "Groceries",
    description: "Groceries",
    notes: "",
    attachments: [
      {
        id: "attachment-1",
        category: "receipt",
        fileName: "receipt.pdf",
        mimeType:
          "application/pdf",
        sizeBytes: 1000,
        dataUrl:
          "data:application/pdf;base64,JVBERi0x",
        createdAt: now,
      },
    ],
    transactionDate: now,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
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

test(
  "transaction create normalizes email member aliases before saving allocations",
  () => {
    seedHousehold();

    const result =
      TransactionService.create(
        {
          ...createSplitExpenseForm(),
          paidByMemberId:
            "rasha@example.com",
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
                "rasha@example.com",
              isIncluded: true,
              allocatedAmount: 50,
              personalAmount: 0,
              personalItems: [],
              notes: "",
            },
          ],
        },
        householdId
      );

    assert.equal(
      result.success,
      true
    );
    assert.equal(
      result.data.paidByMemberId,
      participantMemberId
    );

    const allocations =
      TransactionService
        .getExpenseAllocations(
          result.data.id
        );

    assert.equal(
      allocations.some(
        (allocation) =>
          allocation.memberId ===
            "rasha@example.com" ||
          allocation.paidByMemberId ===
            "rasha@example.com"
      ),
      false
    );
    assert.equal(
      allocations.some(
        (allocation) =>
          allocation.memberId ===
            participantMemberId
      ),
      true
    );
  }
);

test(
  "member can view household transactions with attachments",
  () => {
    seedHousehold();

    assert.equal(
      TransactionService
        .canMemberViewTransaction(
          createTransaction({
            visibility:
              "household",
          }),
          participantMemberId
        ),
      true
    );
  }
);

test(
  "member cannot view another member private transaction attachments",
  () => {
    seedHousehold();

    assert.equal(
      TransactionService
        .canMemberViewTransaction(
          createTransaction({
            visibility:
              "private",
          }),
          uninvolvedMemberId
        ),
      false
    );

    assert.equal(
      TransactionService
        .canMemberViewTransaction(
          createTransaction({
            visibility:
              "private",
          }),
          payerMemberId
        ),
      true
    );
  }
);

test(
  "member can view participant transaction attachments only when allocated",
  () => {
    seedHousehold();

    const createResult =
      TransactionService.create(
        {
          ...createSplitExpenseForm(),
          visibility:
            "participants",
          attachments:
            createTransaction({})
              .attachments ?? [],
        },
        householdId
      );

    assert.equal(
      createResult.success,
      true
    );

    assert.equal(
      TransactionService
        .canMemberViewTransaction(
          createResult.data,
          participantMemberId
        ),
      true
    );

    assert.equal(
      TransactionService
        .canMemberViewTransaction(
          createResult.data,
          uninvolvedMemberId
        ),
      false
    );
  }
);
