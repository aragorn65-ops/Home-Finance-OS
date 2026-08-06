import assert from "node:assert/strict";
import test from "node:test";

import type {
  Account,
} from "../src/features/accounts/models/Account.ts";
import AccountRepository from "../src/features/accounts/repositories/AccountRepository.ts";
import {
  browserCoreSnapshotLocalWriter,
} from "../src/features/auth/services/browserCoreSnapshotLocalWriter.ts";
import {
  HFOS_STORAGE_KEYS,
  saveStoredData,
} from "../src/shared/storage/localStorageStore.ts";
import {
  installBrowserStorage,
} from "./storageTestUtils.ts";

const householdId =
  "household-writer-1";

function createAccount(
  id: string,
  visibility: Account["visibility"]
): Account {
  const now =
    new Date("2026-08-06T00:00:00Z");

  return {
    id,
    householdId,
    ownerMemberId:
      "member-rasha",
    visibility,
    name:
      id,
    institution:
      undefined,
    accountClass:
      "asset",
    type:
      "e-wallet",
    currency:
      "PHP",
    baseCurrency:
      "PHP",
    exchangeRate:
      1,
    openingBalance:
      100,
    currentBalance:
      100,
    openingBaseBalance:
      100,
    currentBaseBalance:
      100,
    isActive:
      true,
    createdAt:
      now,
    updatedAt:
      now,
  };
}

test("cloud restore preserves local-only personal accounts", () => {
  installBrowserStorage();

  const now =
    new Date("2026-08-06T00:00:00Z");

  saveStoredData(
    HFOS_STORAGE_KEYS.household,
    {
      id:
        householdId,
      householdName:
        "Writer Household",
      country:
        "PH",
      currency:
        "PHP",
      timezone:
        "Asia/Manila",
      members: [
        {
          id:
            "member-rasha",
          householdId,
          displayName:
            "Rasha",
          role:
            "member",
          isActive:
            true,
          createdAt:
            now,
          updatedAt:
            now,
        },
      ],
      createdAt:
        now,
      updatedAt:
        now,
    }
  );

  const localPersonalAccount =
    createAccount(
      "local-personal-account",
      "private"
    );
  const localHouseholdAccount =
    createAccount(
      "local-household-account",
      "household"
    );
  const remoteHouseholdAccount =
    createAccount(
      "remote-household-account",
      "household"
    );

  assert.equal(
    AccountRepository.replaceForHousehold(
      householdId,
      [
        localPersonalAccount,
        localHouseholdAccount,
      ]
    ),
    true
  );

  assert.equal(
    browserCoreSnapshotLocalWriter
      .replaceAccounts(
        householdId,
        [
          remoteHouseholdAccount,
        ]
      ),
    true
  );

  assert.deepEqual(
    AccountRepository
      .findAll()
      .map((account) => account.id)
      .sort(),
    [
      "local-personal-account",
      "remote-household-account",
    ]
  );
});

test("cloud restore keeps local accounts when remote account snapshot is empty", () => {
  installBrowserStorage();

  const now =
    new Date("2026-08-06T00:00:00Z");

  saveStoredData(
    HFOS_STORAGE_KEYS.household,
    {
      id:
        householdId,
      householdName:
        "Writer Household",
      country:
        "PH",
      currency:
        "PHP",
      timezone:
        "Asia/Manila",
      members: [
        {
          id:
            "member-rasha",
          householdId,
          displayName:
            "Rasha",
          role:
            "member",
          isActive:
            true,
          createdAt:
            now,
          updatedAt:
            now,
        },
      ],
      createdAt:
        now,
      updatedAt:
        now,
    }
  );

  const localHouseholdAccount =
    createAccount(
      "local-household-account",
      "household"
    );

  assert.equal(
    AccountRepository.replaceForHousehold(
      householdId,
      [
        localHouseholdAccount,
      ]
    ),
    true
  );

  assert.equal(
    browserCoreSnapshotLocalWriter
      .replaceAccounts(
        householdId,
        []
      ),
    true
  );

  assert.deepEqual(
    AccountRepository
      .findAll()
      .map((account) => account.id),
    [
      "local-household-account",
    ]
  );
});

test("linked member shell salvages local personal accounts from previous household id", () => {
  installBrowserStorage();

  const now =
    new Date("2026-08-06T00:00:00Z");
  const previousHouseholdId =
    "previous-local-household";
  const linkedHouseholdId =
    "linked-member-household";
  const personalAccount = {
    ...createAccount(
      "member-personal-account",
      "private"
    ),
    householdId:
      previousHouseholdId,
    ownerMemberId:
      "previous-member-rasha",
  };

  saveStoredData(
    HFOS_STORAGE_KEYS.household,
    {
      id:
        linkedHouseholdId,
      householdName:
        "Linked Member Household",
      country:
        "PH",
      currency:
        "PHP",
      timezone:
        "Asia/Manila",
      authenticatedLink: {
        remoteHouseholdId:
          "remote-household",
        migrationId:
          "member-bootstrap",
        ownerMemberId:
          "member-rasha",
        linkedByUserId:
          "user-rasha",
        linkedAt:
          now.toISOString(),
      },
      members: [
        {
          id:
            "member-rasha",
          householdId:
            linkedHouseholdId,
          displayName:
            "Rasha",
          role:
            "member",
          userId:
            "user-rasha",
          isActive:
            true,
          createdAt:
            now,
          updatedAt:
            now,
        },
      ],
      createdAt:
        now,
      updatedAt:
        now,
    }
  );
  saveStoredData(
    HFOS_STORAGE_KEYS.accounts,
    [
      {
        ...personalAccount,
        createdAt:
          personalAccount.createdAt
            .toISOString(),
        updatedAt:
          personalAccount.updatedAt
            .toISOString(),
      },
    ]
  );

  const accounts =
    AccountRepository.findAll();

  assert.equal(
    accounts.length,
    1
  );
  assert.equal(
    accounts[0]?.id,
    "member-personal-account"
  );
  assert.equal(
    accounts[0]?.householdId,
    linkedHouseholdId
  );
  assert.equal(
    accounts[0]?.ownerMemberId,
    "member-rasha"
  );
});
