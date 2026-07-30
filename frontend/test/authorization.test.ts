import assert from "node:assert/strict";
import test from "node:test";

import {
  canAccessSettlementRecord,
  type AuthorizationContext,
} from "../src/features/auth/services/authorization.ts";
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
