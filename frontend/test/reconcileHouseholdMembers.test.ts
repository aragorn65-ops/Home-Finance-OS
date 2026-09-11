import assert from "node:assert/strict";
import test from "node:test";
import { reconcileHouseholdMembers } from "../src/features/household/services/reconcileHouseholdMembers.ts";
import { resolveHouseholdMemberReference } from "../src/features/household/services/householdMemberResolution.ts";
import type { HouseholdMember } from "../src/features/household/models/HouseholdMember.ts";

function member(id: string, values: Partial<HouseholdMember> = {}): HouseholdMember {
  return { id, householdId: "local", displayName: id, role: "member", isActive: true,
    createdAt: new Date(0), updatedAt: new Date(0), ...values };
}

test("linked user identity repairs owner profile without changing financial references", () => {
  const result = reconcileHouseholdMembers([
    member("member-001", { userId: "owner-user", remoteMemberId: "placeholder" }),
  ], [
    member("member-001", { remoteMemberId: "placeholder" }),
    member("owner-local", { userId: "owner-user", remoteMemberId: "owner-uuid", displayName: "Dadi Buboy", role: "owner" }),
  ], "local");
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "member-001");
  assert.equal(result[0].role, "owner");
  for (const ref of ["member-001", "owner-local", "owner-uuid"]) {
    assert.equal(resolveHouseholdMemberReference(result, ref)?.displayName, "Dadi Buboy");
  }
  assert.deepEqual(reconcileHouseholdMembers(result, [
    member("owner-local", { userId: "owner-user", remoteMemberId: "owner-uuid", displayName: "Dadi Buboy", role: "owner" }),
  ], "local"), result);
});

test("missing remote members are added, including opted-out members, in stable order", () => {
  const remote = [member("r", { displayName: "Rasha" }), member("l", { displayName: "Lyn" }),
    member("d", { displayName: "Dadi Buboy", role: "owner" }), member("m", { displayName: "mama", isActive: false })];
  for (const local of [[remote[0]], [remote[1]], remote]) {
    const result = reconcileHouseholdMembers(local, remote, "local");
    assert.deepEqual(result.map((m) => m.id), ["d", "l", "m", "r"]);
    assert.equal(result[2].isActive, false);
  }
});

test("names cannot link two different identities and placeholders cannot demote an owner", () => {
  const owner = member("old", { displayName: "Dadi Buboy", role: "owner" });
  assert.equal(reconcileHouseholdMembers([owner], [member("new", { displayName: "Dadi Buboy" })], "local").length, 2);
  assert.deepEqual(reconcileHouseholdMembers([owner], [member("old")], "local"), [owner]);
});
