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
  createRemoteCoreSnapshotInput,
  getLocalCoreSnapshotCounts,
  loadRemoteCoreSnapshotForHousehold,
  saveCurrentBrowserCoreSnapshotForHousehold,
  saveLinkedRemoteCoreSnapshot,
  saveRemoteCoreSnapshotForHousehold,
} from "../src/features/auth/services/index.ts";
import type {
  Transaction,
} from "../src/features/transactions/models/Transaction.ts";

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
