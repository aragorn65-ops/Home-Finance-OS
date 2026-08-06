import assert from "node:assert/strict";
import test from "node:test";

import {
  canAccessAccount,
  canAccessSettlementRecord,
  type AuthorizationContext,
} from "../src/features/auth/services/authorization.ts";
import type { Account } from "../src/features/accounts/models/Account.ts";
import type { SettlementForm } from "../src/features/settlements/models/SettlementForm.ts";

function createContext(
  role:
    | "owner"
    | "admin"
    | "member"
    | "viewer",
  memberId = "member-1"
): AuthorizationContext {
  return {
    userId: `user-${memberId}`,
    memberId,
    membership: {
      id: `membership-${memberId}`,
      householdId:
        "household-1",
      userId: `user-${memberId}`,
      memberId,
      role,
      status: "active",
      createdAt:
        new Date("2026-07-30T00:00:00.000Z"),
      updatedAt:
        new Date("2026-07-30T00:00:00.000Z"),
    },
  };
}

const settlementForm:
  SettlementForm = {
  householdId: "household-1",
  fromMemberId: "member-1",
  toMemberId: "member-2",
  amount: 100,
  settlementDate: "2026-07-30",
  sourceAccountId: "",
  destinationAccountId: "",
  applicationMethod: "oldest-first",
  applications: [],
  referenceNumber: "",
  notes: "",
  attachments: [],
  isActive: true,
};

const householdAccount:
  Account = {
  id: "account-household",
  householdId: "household-1",
  ownerMemberId: "member-1",
  name: "Shared Wallet",
  institution: "",
  accountClass: "asset",
  type: "cash",
  currency: "PHP",
  baseCurrency: "PHP",
  exchangeRate: 1,
  exchangeRateSource: "manual",
  currentBalance: 1000,
  currentBaseBalance: 1000,
  visibility: "household",
  isActive: true,
  createdAt:
    new Date("2026-07-30T00:00:00.000Z"),
  updatedAt:
    new Date("2026-07-30T00:00:00.000Z"),
};

const personalAccount:
  Account = {
  ...householdAccount,
  id: "account-personal",
  name: "Personal E-Wallet",
  visibility: "private",
};

test("admin can manage settlement records", () => {
  const context =
    createContext("admin");

  assert.equal(
    canAccessSettlementRecord(
      context,
      settlementForm,
      "create"
    ),
    true
  );

  assert.equal(
    canAccessSettlementRecord(
      context,
      settlementForm,
      "update"
    ),
    true
  );

  assert.equal(
    canAccessSettlementRecord(
      context,
      settlementForm,
      "delete"
    ),
    true
  );
});

test("owner can create settlement records without being payer or receiver", () => {
  assert.equal(
    canAccessSettlementRecord(
      createContext(
        "owner",
        "member-owner"
      ),
      settlementForm,
      "create"
    ),
    true
  );
});

test("member can create settlement records only when involved", () => {
  assert.equal(
    canAccessSettlementRecord(
      createContext(
        "member",
        "member-1"
      ),
      settlementForm,
      "create"
    ),
    true
  );

  assert.equal(
    canAccessSettlementRecord(
      createContext(
        "member",
        "member-3"
      ),
      settlementForm,
      "create"
    ),
    false
  );
});

test("member cannot update or delete settlement records", () => {
  const context =
    createContext(
      "member",
      "member-1"
    );

  assert.equal(
    canAccessSettlementRecord(
      context,
      settlementForm,
      "update"
    ),
    false
  );

  assert.equal(
    canAccessSettlementRecord(
      context,
      settlementForm,
      "delete"
    ),
    false
  );
});

test("viewer and signed-out users cannot create settlement records", () => {
  assert.equal(
    canAccessSettlementRecord(
      createContext(
        "viewer",
        "member-1"
      ),
      settlementForm,
      "create"
    ),
    false
  );

  assert.equal(
    canAccessSettlementRecord(
      {},
      settlementForm,
      "create"
    ),
    false
  );
});

test("admin can manage household accounts", () => {
  const context =
    createContext("admin");

  assert.equal(
    canAccessAccount(
      context,
      householdAccount,
      "view"
    ),
    true
  );

  assert.equal(
    canAccessAccount(
      context,
      householdAccount,
      "update"
    ),
    true
  );

  assert.equal(
    canAccessAccount(
      context,
      householdAccount,
      "delete"
    ),
    true
  );
});

test("member and viewer can only view household accounts", () => {
  const memberContext =
    createContext("member");
  const viewerContext =
    createContext("viewer");

  assert.equal(
    canAccessAccount(
      memberContext,
      householdAccount,
      "view"
    ),
    true
  );

  assert.equal(
    canAccessAccount(
      memberContext,
      householdAccount,
      "update"
    ),
    false
  );

  assert.equal(
    canAccessAccount(
      viewerContext,
      householdAccount,
      "view"
    ),
    true
  );

  assert.equal(
    canAccessAccount(
      viewerContext,
      householdAccount,
      "delete"
    ),
    false
  );
});

test("member can manage only their own personal accounts", () => {
  assert.equal(
    canAccessAccount(
      createContext(
        "member",
        "member-1"
      ),
      personalAccount,
      "view"
    ),
    true
  );

  assert.equal(
    canAccessAccount(
      createContext(
        "member",
        "member-1"
      ),
      personalAccount,
      "update"
    ),
    true
  );

  assert.equal(
    canAccessAccount(
      createContext(
        "member",
        "member-1"
      ),
      personalAccount,
      "delete"
    ),
    true
  );

  assert.equal(
    canAccessAccount(
      createContext(
        "member",
        "member-2"
      ),
      personalAccount,
      "view"
    ),
    false
  );

  assert.equal(
    canAccessAccount(
      createContext(
        "member",
        "member-1"
      ),
      householdAccount,
      "update"
    ),
    false
  );
});

test("admin can delete but not view another member personal account", () => {
  const adminContext =
    createContext(
      "admin",
      "member-admin"
    );

  assert.equal(
    canAccessAccount(
      adminContext,
      personalAccount,
      "view"
    ),
    false
  );

  assert.equal(
    canAccessAccount(
      adminContext,
      personalAccount,
      "update"
    ),
    false
  );

  assert.equal(
    canAccessAccount(
      adminContext,
      personalAccount,
      "delete"
    ),
    true
  );
});

test("admin can view personal account with legacy member id alias", () => {
  const adminContext =
    createContext(
      "admin",
      "member-local-admin"
    );

  adminContext.memberIds = [
    "member-local-admin",
    "member-remote-admin",
  ];

  assert.equal(
    canAccessAccount(
      adminContext,
      {
        ...personalAccount,
        ownerMemberId:
          "member-remote-admin",
      },
      "view"
    ),
    true
  );
});
