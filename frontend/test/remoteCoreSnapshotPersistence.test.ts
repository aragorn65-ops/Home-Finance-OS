import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemoryAuthBackendAdapter,
  createMembership,
} from "../src/features/auth/services/index.ts";
import type {
  AuthUser,
  RemoteHouseholdCoreSnapshot,
  RemoteMigrationAccountUploadRecord,
  RemoteMigrationTransactionUploadRecord,
} from "../src/features/auth/models/index.ts";

const householdId =
  "household-core-1";

const adminUser: AuthUser = {
  id: "user-admin",
  email: "admin@hfos.local",
  createdAt:
    new Date("2026-07-30T00:00:00.000Z"),
  updatedAt:
    new Date("2026-07-30T00:00:00.000Z"),
};

const memberUser: AuthUser = {
  id: "user-member",
  email: "member@hfos.local",
  createdAt:
    new Date("2026-07-30T00:00:00.000Z"),
  updatedAt:
    new Date("2026-07-30T00:00:00.000Z"),
};

const account:
  RemoteMigrationAccountUploadRecord = {
  id: "account-1",
  visibility: "household",
  name: "Cash Wallet",
  accountClass: "asset",
  type: "cash",
  currency: "PHP",
  openingBalance: 500,
  currentBalance: 750,
  isActive: true,
  createdAt:
    "2026-07-30T00:00:00.000Z",
  updatedAt:
    "2026-07-30T01:00:00.000Z",
};

const transaction:
  RemoteMigrationTransactionUploadRecord = {
  id: "transaction-1",
  visibility: "household",
  type: "expense",
  amount: 125,
  sourceAccountId:
    "account-1",
  destinationAccountId:
    null,
  category: "Groceries",
  description: "Market",
  notes: "",
  transactionDate:
    "2026-07-30",
  isActive: true,
  createdAt:
    "2026-07-30T02:00:00.000Z",
  updatedAt:
    "2026-07-30T02:00:00.000Z",
};

function createAdapter(
  user: AuthUser,
  coreSnapshots:
    RemoteHouseholdCoreSnapshot[] = []
) {
  return new InMemoryAuthBackendAdapter({
    user,
    households: [
      {
        id: householdId,
        name: "Core Household",
        ownerMemberId:
          "member-admin",
        status: "active",
        createdAt:
          new Date(
            "2026-07-30T00:00:00.000Z"
          ),
        updatedAt:
          new Date(
            "2026-07-30T00:00:00.000Z"
          ),
      },
    ],
    memberships: [
      createMembership({
        householdId,
        userId:
          adminUser.id,
        memberId:
          "member-admin",
        role: "admin",
      }),
      createMembership({
        householdId,
        userId:
          memberUser.id,
        memberId:
          "member-1",
        role: "member",
      }),
    ],
    coreSnapshots,
  });
}

test("remote core snapshot persistence allows admin save and load", async () => {
  const adapter =
    createAdapter(adminUser);

  const saved =
    await adapter.saveRemoteCoreSnapshot({
      householdId,
      accounts: [
        account,
      ],
      transactions: [
        transaction,
      ],
    });

  assert.equal(
    saved.householdId,
    householdId
  );
  assert.equal(
    saved.accounts.length,
    1
  );
  assert.equal(
    saved.transactions.length,
    1
  );
  assert.ok(saved.savedAt);

  saved.accounts[0]!.name =
    "Mutated";

  const loaded =
    await adapter.loadRemoteCoreSnapshot(
      householdId
    );

  assert.equal(
    loaded.accounts[0]?.name,
    "Cash Wallet"
  );
  assert.equal(
    loaded.transactions[0]
      ?.description,
    "Market"
  );
});

test("remote core snapshot persistence allows member load but blocks save", async () => {
  const memberAdapter =
    createAdapter(
      memberUser,
      [
        {
          householdId,
          accounts: [
            account,
          ],
          transactions: [
            transaction,
          ],
          expenseAllocations:
            [],
          savedAt:
            new Date(
              "2026-07-30T03:00:00.000Z"
            ),
        },
      ]
    );

  const loaded =
    await memberAdapter
      .loadRemoteCoreSnapshot(
        householdId
      );
  assert.equal(
    loaded.accounts[0]?.name,
    "Cash Wallet"
  );
  assert.equal(
    loaded.transactions[0]
      ?.description,
    "Market"
  );
  await assert.rejects(
    () =>
      memberAdapter
        .saveRemoteCoreSnapshot({
        householdId,
        accounts: [
          account,
        ],
        transactions: [
          transaction,
        ],
      }),
    /Only a household admin can save core finance records\./
  );
});
