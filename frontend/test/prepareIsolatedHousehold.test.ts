import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { prepareIsolatedHousehold } from "../src/features/auth/services/prepareIsolatedHousehold.ts";
import { authFeatureConfig } from "../src/config/auth.ts";
import { applicationStorageScope, getApplicationStorage } from "../src/shared/storage/userScopedStorage.ts";
import { HFOS_STORAGE_KEYS } from "../src/shared/storage/localStorageStore.ts";
import { loadHousehold } from "../src/features/household/services/householdStorage.ts";
import { installBrowserStorage } from "./storageTestUtils.ts";
import type { HouseholdMembership } from "../src/features/auth/models/index.ts";

function setup(id: string, role: HouseholdMembership["role"] = "member") {
  const raw = installBrowserStorage().localStorage;
  authFeatureConfig.enabled = true;
  authFeatureConfig.provider = "supabase";
  applicationStorageScope.lock();
  applicationStorageScope.select(id);
  const now = new Date("2026-10-04T00:00:00Z");
  const householdId = `household-${id}`;
  const membership: HouseholdMembership = {
    id: `membership-${id}`, userId: id, householdId, memberId: `member-${id}`, role,
    status: "active", createdAt: now, updatedAt: now,
  };
  const members = [{
    id: `member-${id}`, householdId, userId: id, displayName: id,
    role: role === "viewer" ? "member" as const : role,
    isActive: true, createdAt: now, updatedAt: now,
  }];
  let snapshotLoads = 0;
  const adapter = {
    async listMemberships() { return [membership]; },
    async loadRemoteHousehold() {
      return { id: householdId, name: "Test household", country: "PH", currency: "PHP",
        timezone: "Asia/Manila", ownerMemberId: `member-${id}`, status: "active" as const,
        createdAt: now, updatedAt: now };
    },
    async listRemoteHouseholdMembers() { return members; },
    async loadRemoteCoreSnapshot() {
      snapshotLoads += 1;
      return { householdId, accounts: [], transactions: [], expenseAllocations: [], providerBills: [] };
    },
    async saveRemoteCoreSnapshot(): Promise<never> { throw new Error("Bootstrap must never save cloud data"); },
  };
  return { raw, adapter, householdId, loads: () => snapshotLoads };
}

for (const role of ["owner", "admin", "member", "viewer"] as const) {
  test(`${role} starts from authorized cloud records without adopting unassigned browser data`, async () => {
    const id = `bootstrap-${role}`;
    const f = setup(id, role);
    f.raw.setItem(HFOS_STORAGE_KEYS.accounts, "legacy-private-data");
    await prepareIsolatedHousehold(f.adapter, id, () => true);
    assert.equal(loadHousehold()?.authenticatedLink?.linkedByUserId, id);
    assert.equal(loadHousehold()?.id, f.householdId);
    assert.equal(f.loads(), 1);
    for (const key of Object.values(HFOS_STORAGE_KEYS)) assert.ok(getApplicationStorage()!.getItem(key));
    assert.doesNotMatch(getApplicationStorage()!.getItem(HFOS_STORAGE_KEYS.accounts)!, /legacy-private-data/);
    assert.equal(f.raw.getItem(HFOS_STORAGE_KEYS.accounts), "legacy-private-data");
    await prepareIsolatedHousehold(f.adapter, id, () => true);
    assert.equal(f.loads(), 1, "an initialized user's offline cache is not rebuilt on every start");
  });
}

test("new scope with failed cloud load rolls back instead of exposing an empty writable household", async () => {
  const f = setup("bootstrap-failed");
  f.adapter.loadRemoteCoreSnapshot = async () => { throw new Error("Cloud offline"); };
  await assert.rejects(prepareIsolatedHousehold(f.adapter, "bootstrap-failed", () => true), /Cloud offline/);
  assert.equal(getApplicationStorage()!.getItem(HFOS_STORAGE_KEYS.household), null);
  assert.equal(getApplicationStorage()!.getItem("hfos.private-storage-ready.v1"), null);
});

test("first private-cache bootstrap preserves the existing browser lock and theme", async () => {
  const f = setup("bootstrap-locked");
  const lock = JSON.stringify({ enabled: true, pinHash: "test-hash", salt: "test-salt" });
  f.raw.setItem("hfos.v1.app-lock", lock);
  f.raw.setItem("hfos.themePreference", "dark");
  await prepareIsolatedHousehold(f.adapter, "bootstrap-locked", () => true);
  assert.equal(getApplicationStorage()!.getItem("hfos.v1.app-lock"), lock);
  assert.equal(getApplicationStorage()!.getItem("hfos.themePreference"), "dark");
  assert.equal(f.raw.getItem("hfos.v1.app-lock"), lock);
  getApplicationStorage()!.setItem("hfos.themePreference", "light");
  await prepareIsolatedHousehold(f.adapter, "bootstrap-locked", () => true);
  assert.equal(getApplicationStorage()!.getItem("hfos.themePreference"), "light");
});

test("cancelled bootstrap never creates a household for the previous user", async () => {
  const f = setup("bootstrap-cancelled");
  await prepareIsolatedHousehold(f.adapter, "bootstrap-cancelled", () => false);
  assert.equal(getApplicationStorage()!.length, 0);
  assert.equal(f.loads(), 0);
});

test("bootstrap ignores memberships belonging to another user", async () => {
  const f = setup("bootstrap-other");
  await prepareIsolatedHousehold(f.adapter, "not-the-member", () => true);
  assert.equal(getApplicationStorage()!.length, 0);
});

test("mismatched remote household cannot initialize the user's cache", async () => {
  const f = setup("bootstrap-mismatch");
  const load = f.adapter.loadRemoteHousehold;
  f.adapter.loadRemoteHousehold = async () => ({ ...await load(), id: "another-household" });
  await assert.rejects(prepareIsolatedHousehold(f.adapter, "bootstrap-mismatch", () => true), /does not match/);
  assert.equal(getApplicationStorage()!.length, 0);
});

test("profile owned by another user cannot be adopted even when a local member id matches", async () => {
  const f = setup("bootstrap-profile-mismatch");
  const load = f.adapter.listRemoteHouseholdMembers;
  f.adapter.listRemoteHouseholdMembers = async () => (await load()).map((member) => ({ ...member, userId: "someone-else" }));
  await assert.rejects(prepareIsolatedHousehold(f.adapter, "bootstrap-profile-mismatch", () => true), /could not be verified/);
  assert.equal(getApplicationStorage()!.length, 0);
});

test("storage quota failure rolls back the new scope and preserves unassigned legacy data", async () => {
  const f = setup("bootstrap-quota");
  f.raw.setItem(HFOS_STORAGE_KEYS.accounts, "legacy-original");
  const write = f.raw.setItem.bind(f.raw);
  f.raw.setItem = (key, value) => {
    if (key.endsWith(`:${HFOS_STORAGE_KEYS.accounts}`)) throw new Error("Quota exceeded");
    write(key, value);
  };
  await assert.rejects(prepareIsolatedHousehold(f.adapter, "bootstrap-quota", () => true), /could not be initialized/);
  assert.equal(getApplicationStorage()!.length, 0);
  assert.equal(f.raw.getItem(HFOS_STORAGE_KEYS.accounts), "legacy-original");
});

test("root storage boundary locks and reloads on identity change before mounting another user's app", () => {
  const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  const boundary = readFileSync(new URL("../src/features/auth/components/PrivateStorageBoundary.tsx", import.meta.url), "utf8");
  assert.match(app, /<PrivateStorageBoundary><AppRouter\s*\/><\/PrivateStorageBoundary>/);
  assert.match(boundary, /applicationStorageScope\.lock\(\);[\s\S]*?flushSync\(\(\) => setReady\(false\)\);[\s\S]*?window\.location\.reload\(\)/);
  assert.match(boundary, /await prepareIsolatedHousehold/);
});
