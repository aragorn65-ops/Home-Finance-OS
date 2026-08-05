import assert from "node:assert/strict";
import test from "node:test";

import type {
  Account,
} from "../src/features/accounts/models/Account.ts";
import type {
  RemoteHouseholdCoreSnapshot,
  RemoteHouseholdCoreSnapshotInput,
} from "../src/features/auth/models/index.ts";
import {
  applyRemoteCoreSnapshotToLocalHousehold,
  createRemoteCoreSnapshotInput,
  getLocalCoreSnapshotCounts,
  loadRemoteCoreSnapshotForHousehold,
  restoreLinkedRemoteCoreSnapshot,
  saveCurrentBrowserCoreSnapshotForHousehold,
  saveLinkedRemoteCoreSnapshot,
  saveRemoteCoreSnapshotForHousehold,
} from "../src/features/auth/services/index.ts";
import type {
  Transaction,
} from "../src/features/transactions/models/Transaction.ts";
import type {
  ExpenseAllocation,
} from "../src/features/transactions/models/ExpenseAllocation.ts";

const householdId =
  "household-core-sync-1";

const account: Account = {
  id:
    "account-1",
  householdId,
  ownerMemberId:
    "member-1",
  visibility:
    "household",
  name:
    "Operating Cash",
  institution:
    "Wallet",
  accountClass:
    "asset",
  type:
    "cash",
  currency:
    "PHP",
  baseCurrency:
    "PHP",
  exchangeRate:
    1,
  exchangeRateEffectiveDate:
    new Date("2026-07-30T00:00:00Z"),
  exchangeRateSource:
    "manual",
  openingBalance:
    1000,
  currentBalance:
    850,
  openingBaseBalance:
    1000,
  currentBaseBalance:
    850,
  isActive:
    true,
  createdAt:
    new Date("2026-07-30T01:00:00Z"),
  updatedAt:
    new Date("2026-07-30T02:00:00Z"),
};

const transaction: Transaction = {
  id:
    "transaction-1",
  householdId,
  createdByMemberId:
    "member-1",
  paidByMemberId:
    "member-1",
  expenseSplitMethod:
    "equal",
  visibility:
    "household",
  type:
    "expense",
  amount:
    150,
  enteredAmount:
    150,
  enteredCurrency:
    "PHP",
  baseCurrency:
    "PHP",
  baseAmount:
    150,
  exchangeRate:
    1,
  exchangeRateEffectiveDate:
    new Date("2026-07-30T00:00:00Z"),
  exchangeRateSource:
    "manual",
  sourceAccountId:
    "account-1",
  destinationAccountId:
    null,
  category:
    "Utilities",
  description:
    "Electric bill",
  notes:
    "",
  attachments:
    [],
  transactionDate:
    new Date("2026-07-30T12:00:00Z"),
  isActive:
    true,
  createdAt:
    new Date("2026-07-30T13:00:00Z"),
  updatedAt:
    new Date("2026-07-30T14:00:00Z"),
};

const expenseAllocation: ExpenseAllocation = {
  id:
    "allocation-1",
  transactionId:
    "transaction-1",
  paidByMemberId:
    "member-1",
  memberId:
    "member-2",
  isIncluded:
    true,
  allocatedAmount:
    150,
  createdAt:
    new Date("2026-07-30T13:05:00Z"),
  updatedAt:
    new Date("2026-07-30T14:05:00Z"),
};

test("creates a remote core snapshot input from local household records", () => {
  const remoteHouseholdId =
    "remote-household-core-sync-1";
  const input =
    createRemoteCoreSnapshotInput({
      householdId:
        remoteHouseholdId,
      localHouseholdId:
        householdId,
      accounts: [
        account,
        {
          ...account,
          id:
            "account-other",
          householdId:
            "household-other",
        },
      ],
      transactions: [
        transaction,
        {
          ...transaction,
          id:
            "transaction-other",
          householdId:
            "household-other",
        },
      ],
      expenseAllocations: [
        expenseAllocation,
        {
          ...expenseAllocation,
          id:
            "allocation-other",
          transactionId:
            "transaction-other",
        },
      ],
    });

  assert.equal(
    input.householdId,
    remoteHouseholdId
  );
  assert.deepEqual(
    input.accounts.map(
      (record) => record.id
    ),
    [
      "account-1",
    ]
  );
  assert.deepEqual(
    input.transactions.map(
      (record) => record.id
    ),
    [
      "transaction-1",
    ]
  );
  assert.equal(
    input.accounts[0]?.name,
    "Operating Cash"
  );
  assert.equal(
    input.transactions[0]
      ?.transactionDate,
    "2026-07-30"
  );
  assert.deepEqual(
    input.expenseAllocations.map(
      (record) => record.id
    ),
    [
      "allocation-1",
    ]
  );
  assert.equal(
    input.expenseAllocations[0]
      ?.transactionId,
    "transaction-1"
  );
});

test("saves a local core snapshot through the adapter", async () => {
  let savedInput:
    | RemoteHouseholdCoreSnapshotInput
    | undefined;
  const expected: RemoteHouseholdCoreSnapshot = {
    householdId,
    accounts: [
      {
        id: "account-1",
        visibility: "household",
        name: "Operating Cash",
        accountClass: "asset",
        type: "cash",
        currency: "PHP",
        openingBalance: 1000,
        currentBalance: 850,
        isActive: true,
        createdAt:
          "2026-07-30T01:00:00.000Z",
        updatedAt:
          "2026-07-30T02:00:00.000Z",
      },
    ],
    transactions: [],
    savedAt:
      new Date("2026-07-30T15:00:00Z"),
  };

  const adapter = {
    async loadRemoteCoreSnapshot() {
      throw new Error("unused");
    },
    async saveRemoteCoreSnapshot(
      input: RemoteHouseholdCoreSnapshotInput
    ) {
      savedInput =
        input;

      return expected;
    },
  };

  const result =
    await saveRemoteCoreSnapshotForHousehold(
      adapter,
      {
        householdId,
        accounts: [
          account,
        ],
        transactions: [
          transaction,
        ],
      }
    );

  assert.equal(
    result,
    expected
  );
  assert.equal(
    savedInput?.householdId,
    householdId
  );
  assert.equal(
    savedInput?.accounts[0]?.id,
    "account-1"
  );
  assert.equal(
    savedInput?.transactions[0]
      ?.id,
    "transaction-1"
  );
});

test("counts local core snapshot records from an injected source", () => {
  const counts =
    getLocalCoreSnapshotCounts(
      householdId,
      {
        getAccounts() {
          return [
            account,
            {
              ...account,
              id:
                "account-other",
              householdId:
                "household-other",
            },
          ];
        },
        getTransactions() {
          return [
            transaction,
            {
              ...transaction,
              id:
                "transaction-other",
              householdId:
                "household-other",
            },
          ];
        },
      }
    );

  assert.deepEqual(
    counts,
    {
      accountCount: 1,
      transactionCount: 1,
    }
  );
});

test("saves current browser core records through an injected source", async () => {
  const remoteHouseholdId =
    "remote-household-core-sync-2";
  let savedInput:
    | RemoteHouseholdCoreSnapshotInput
    | undefined;
  const expected: RemoteHouseholdCoreSnapshot = {
    householdId:
      remoteHouseholdId,
    accounts: [],
    transactions: [],
    savedAt:
      new Date("2026-07-30T15:30:00Z"),
  };

  const adapter = {
    async loadRemoteCoreSnapshot() {
      throw new Error("unused");
    },
    async saveRemoteCoreSnapshot(
      input: RemoteHouseholdCoreSnapshotInput
    ) {
      savedInput =
        input;

      return expected;
    },
  };

  const result =
    await saveCurrentBrowserCoreSnapshotForHousehold({
      adapter,
      householdId:
        remoteHouseholdId,
      localHouseholdId:
        householdId,
      recordSource: {
        getAccounts() {
          return [
            account,
          ];
        },
        getTransactions() {
          return [
            transaction,
          ];
        },
      },
    });

  assert.equal(
    result,
    expected
  );
  assert.equal(
    savedInput?.householdId,
    remoteHouseholdId
  );
  assert.equal(
    savedInput?.accounts[0]?.id,
    "account-1"
  );
  assert.equal(
    savedInput?.transactions[0]
      ?.id,
    "transaction-1"
  );
});

test("skips linked core snapshot save when auth is disabled", async () => {
  const result =
    await saveLinkedRemoteCoreSnapshot({
      authEnabled: false,
      household: {
        id: householdId,
        authenticatedLink: {
          remoteHouseholdId:
            "remote-household-1",
        },
      },
      adapter: {
        async loadRemoteCoreSnapshot() {
          throw new Error("unused");
        },
        async saveRemoteCoreSnapshot() {
          throw new Error("unused");
        },
      },
      recordSource: {
        getAccounts() {
          return [
            account,
          ];
        },
        getTransactions() {
          return [
            transaction,
          ];
        },
      },
    });

  assert.deepEqual(
    result,
    {
      status: "skipped",
      reason: "auth-disabled",
    }
  );
});

test("skips linked core snapshot save without a household", async () => {
  const result =
    await saveLinkedRemoteCoreSnapshot({
      authEnabled: true,
      household: null,
      adapter: {
        async loadRemoteCoreSnapshot() {
          throw new Error("unused");
        },
        async saveRemoteCoreSnapshot() {
          throw new Error("unused");
        },
      },
      recordSource: {
        getAccounts() {
          return [];
        },
        getTransactions() {
          return [];
        },
      },
    });

  assert.deepEqual(
    result,
    {
      status: "skipped",
      reason: "missing-household",
    }
  );
});

test("skips linked core snapshot save for unlinked households", async () => {
  const result =
    await saveLinkedRemoteCoreSnapshot({
      authEnabled: true,
      household: {
        id: householdId,
      },
      adapter: {
        async loadRemoteCoreSnapshot() {
          throw new Error("unused");
        },
        async saveRemoteCoreSnapshot() {
          throw new Error("unused");
        },
      },
      recordSource: {
        getAccounts() {
          return [];
        },
        getTransactions() {
          return [];
        },
      },
    });

  assert.deepEqual(
    result,
    {
      status: "skipped",
      reason: "unlinked-household",
    }
  );
});

test("saves linked core snapshot to the authenticated household", async () => {
  const remoteHouseholdId =
    "remote-household-linked-1";
  let savedInput:
    | RemoteHouseholdCoreSnapshotInput
    | undefined;
  const expected: RemoteHouseholdCoreSnapshot = {
    householdId:
      remoteHouseholdId,
    accounts: [],
    transactions: [],
    savedAt:
      new Date("2026-07-30T15:45:00Z"),
  };

  const result =
    await saveLinkedRemoteCoreSnapshot({
      authEnabled: true,
      household: {
        id: householdId,
        authenticatedLink: {
          remoteHouseholdId,
        },
      },
      adapter: {
        async loadRemoteCoreSnapshot() {
          throw new Error("unused");
        },
        async saveRemoteCoreSnapshot(
          input: RemoteHouseholdCoreSnapshotInput
        ) {
          savedInput =
            input;

          return expected;
        },
      },
      recordSource: {
        getAccounts() {
          return [
            account,
          ];
        },
        getTransactions() {
          return [
            transaction,
          ];
        },
      },
    });

  assert.equal(
    result.status,
    "saved"
  );
  assert.equal(
    savedInput?.householdId,
    remoteHouseholdId
  );
  assert.equal(
    savedInput?.accounts[0]?.id,
    "account-1"
  );
  assert.equal(
    savedInput?.transactions[0]
      ?.id,
    "transaction-1"
  );
});

test("linked core snapshot save surfaces cloud write failures", async () => {
  await assert.rejects(
    () =>
      saveLinkedRemoteCoreSnapshot({
        authEnabled: true,
        household: {
          id: householdId,
          authenticatedLink: {
            remoteHouseholdId:
              "remote-household-failing-1",
          },
        },
        adapter: {
          async loadRemoteCoreSnapshot() {
            throw new Error("unused");
          },
          async saveRemoteCoreSnapshot() {
            throw new Error(
              "Supabase write failed."
            );
          },
        },
        recordSource: {
          getAccounts() {
            return [
              account,
            ];
          },
          getTransactions() {
            return [
              transaction,
            ];
          },
        },
      }),
    /Supabase write failed\./
  );
});

test("loads a remote core snapshot through the adapter", async () => {
  let loadedHouseholdId:
    | string
    | undefined;
  const expected: RemoteHouseholdCoreSnapshot = {
    householdId,
    accounts: [],
    transactions: [],
    savedAt:
      new Date("2026-07-30T16:00:00Z"),
  };

  const adapter = {
    async loadRemoteCoreSnapshot(
      targetHouseholdId: string
    ) {
      loadedHouseholdId =
        targetHouseholdId;

      return expected;
    },
    async saveRemoteCoreSnapshot() {
      throw new Error("unused");
    },
  };

  const result =
    await loadRemoteCoreSnapshotForHousehold(
      adapter,
      householdId
    );

  assert.equal(
    result,
    expected
  );
  assert.equal(
    loadedHouseholdId,
    householdId
  );
});

test("applies a remote core snapshot to the local household", () => {
  const remoteHouseholdId =
    "remote-household-core-restore-1";
  let replacedAccounts:
    Account[] = [];
  let replacedTransactions:
    Transaction[] = [];
  const snapshot:
    RemoteHouseholdCoreSnapshot = {
    householdId:
      remoteHouseholdId,
    accounts: [
      {
        id: "account-remote-1",
        visibility: "household",
        name: "Restored Cash",
        accountClass: "asset",
        type: "cash",
        currency: "PHP",
        openingBalance: 500,
        currentBalance: 450,
        isActive: true,
        createdAt:
          "2026-07-29T01:00:00.000Z",
        updatedAt:
          "2026-07-29T02:00:00.000Z",
      },
    ],
    transactions: [
      {
        id: "transaction-remote-1",
        visibility: "household",
        type: "expense",
        amount: 50,
        sourceAccountId:
          "account-remote-1",
        destinationAccountId:
          null,
        category: "Food",
        description: "Lunch",
        notes: "",
        transactionDate:
          "2026-07-29",
        isActive: true,
        createdAt:
          "2026-07-29T03:00:00.000Z",
        updatedAt:
          "2026-07-29T04:00:00.000Z",
      },
    ],
  };

  const result =
    applyRemoteCoreSnapshotToLocalHousehold({
      snapshot,
      localHouseholdId:
        householdId,
      ownerMemberId:
        "member-owner-1",
      writer: {
        replaceAccounts(
          targetHouseholdId,
          accounts
        ) {
          assert.equal(
            targetHouseholdId,
            householdId
          );
          replacedAccounts =
            accounts;

          return true;
        },
        replaceTransactions(
          targetHouseholdId,
          transactions
        ) {
          assert.equal(
            targetHouseholdId,
            householdId
          );
          replacedTransactions =
            transactions;

          return true;
        },
      },
    });

  assert.deepEqual(
    result,
    {
      accountCount: 1,
      transactionCount: 1,
    }
  );
  assert.equal(
    replacedAccounts[0]?.householdId,
    householdId
  );
  assert.equal(
    replacedAccounts[0]?.ownerMemberId,
    "member-owner-1"
  );
  assert.equal(
    replacedTransactions[0]?.householdId,
    householdId
  );
  assert.equal(
    replacedTransactions[0]?.transactionDate
      .toISOString()
      .slice(0, 10),
    "2026-07-29"
  );
});

test("keeps local expense allocations when remote core snapshot has none for existing transactions", () => {
  let replacedAllocations = false;
  const snapshot:
    RemoteHouseholdCoreSnapshot = {
    householdId:
      "remote-household-core-empty-allocations",
    accounts: [],
    transactions: [
      {
        id: "transaction-remote-empty-allocation",
        visibility: "household",
        type: "expense",
        amount: 9000,
        sourceAccountId: null,
        destinationAccountId: null,
        category: "Utilities",
        description: "July electricity",
        notes: "",
        transactionDate:
          "2026-07-31",
        isActive: true,
        createdAt:
          "2026-07-31T03:00:00.000Z",
        updatedAt:
          "2026-07-31T04:00:00.000Z",
      },
    ],
    expenseAllocations: [],
  };

  applyRemoteCoreSnapshotToLocalHousehold({
    snapshot,
    localHouseholdId:
      householdId,
    ownerMemberId:
      "member-owner-1",
    writer: {
      replaceAccounts() {
        return true;
      },
      replaceTransactions() {
        return true;
      },
      replaceExpenseAllocations() {
        replacedAllocations = true;

        return true;
      },
    },
  });

  assert.equal(
    replacedAllocations,
    false
  );
});

test("restores a linked remote core snapshot", async () => {
  const remoteHouseholdId =
    "remote-household-linked-restore-1";
  let loadedHouseholdId:
    | string
    | undefined;
  let replacedAccountCount = 0;
  let replacedTransactionCount = 0;
  const snapshot:
    RemoteHouseholdCoreSnapshot = {
    householdId:
      remoteHouseholdId,
    accounts: [
      {
        id: "account-remote-2",
        visibility: "household",
        name: "Restored Savings",
        accountClass: "asset",
        type: "savings",
        currency: "PHP",
        openingBalance: 1200,
        currentBalance: 1400,
        isActive: true,
        createdAt:
          "2026-07-30T01:00:00.000Z",
        updatedAt:
          "2026-07-30T02:00:00.000Z",
      },
    ],
    transactions: [],
  };

  const result =
    await restoreLinkedRemoteCoreSnapshot({
      authEnabled: true,
      household: {
        id: householdId,
        authenticatedLink: {
          remoteHouseholdId,
          ownerMemberId:
            "member-owner-2",
        },
      },
      adapter: {
        async loadRemoteCoreSnapshot(
          targetHouseholdId: string
        ) {
          loadedHouseholdId =
            targetHouseholdId;

          return snapshot;
        },
        async saveRemoteCoreSnapshot() {
          throw new Error("unused");
        },
      },
      writer: {
        replaceAccounts(
          targetHouseholdId,
          accounts
        ) {
          assert.equal(
            targetHouseholdId,
            householdId
          );
          assert.equal(
            accounts[0]?.ownerMemberId,
            "member-owner-2"
          );
          replacedAccountCount =
            accounts.length;

          return true;
        },
        replaceTransactions(
          targetHouseholdId,
          transactions
        ) {
          assert.equal(
            targetHouseholdId,
            householdId
          );
          replacedTransactionCount =
            transactions.length;

          return true;
        },
      },
    });

  assert.equal(
    result.status,
    "restored"
  );
  assert.equal(
    loadedHouseholdId,
    remoteHouseholdId
  );
  assert.equal(
    replacedAccountCount,
    1
  );
  assert.equal(
    replacedTransactionCount,
    0
  );
});
