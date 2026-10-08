import assert from "node:assert/strict";
import test from "node:test";
import { getSessionMemberships } from "../src/features/auth/services/sessionMemberships.ts";
import type { AuthSession, HouseholdMembership } from "../src/features/auth/models/index.ts";

const now = new Date("2026-10-01T00:00:00Z");
const session = (id: string): AuthSession => ({
  status: "signed-in", user: { id, email: `${id}@example.test`, createdAt: now, updatedAt: now },
});
const membership = (userId: string, role: HouseholdMembership["role"]): HouseholdMembership => ({
  id: `membership-${userId}`, userId, role, householdId: "household", memberId: `member-${userId}`,
  status: "active", createdAt: now, updatedAt: now,
});

test("switching from admin to member cannot reuse the previous user's membership", () => {
  assert.deepEqual(getSessionMemberships([membership("admin", "owner")], session("rasha")), []);
  const own = membership("rasha", "member");
  assert.deepEqual(getSessionMemberships([membership("admin", "owner"), own], session("rasha")), [own]);
});

test("signed-out and loading sessions expose no cached memberships", () => {
  const records = [membership("rasha", "member")];
  assert.deepEqual(getSessionMemberships(records, { status: "signed-out" }), []);
  assert.deepEqual(getSessionMemberships(records, { ...session("rasha"), status: "loading" }), []);
  assert.deepEqual(getSessionMemberships(records, { status: "signed-in" }), []);
});

test("membership selection rejects inactive and mismatched-household records", () => {
  assert.deepEqual(getSessionMemberships([
    { ...membership("rasha", "member"), status: "removed" },
  ], session("rasha")), []);
  assert.deepEqual(getSessionMemberships([membership("rasha", "member")], session("rasha"), "other"), []);
});
