import assert from "node:assert/strict";
import test from "node:test";
import { UserScopedStorage, applicationStorageScope, getApplicationStorage } from "../src/shared/storage/userScopedStorage.ts";
import { authFeatureConfig } from "../src/config/auth.ts";
import { HFOS_STORAGE_KEYS, loadStoredData, saveStoredData } from "../src/shared/storage/localStorageStore.ts";
import { createLinkedHousehold, installBrowserStorage, MemoryStorage } from "./storageTestUtils.ts";
import { createApplicationBackup, restoreApplicationBackup } from "../src/features/startup/services/applicationBackup.ts";
import { resetApplicationData, resetHouseholdTestData } from "../src/features/startup/services/applicationDataReset.ts";

function setup() {
  const result = installBrowserStorage();
  authFeatureConfig.enabled = true;
  authFeatureConfig.provider = "supabase";
  applicationStorageScope.lock();
  return result;
}

function seed(userId: string) {
  applicationStorageScope.select(userId);
  const household = createLinkedHousehold();
  household.authenticatedLink.linkedByUserId = userId;
  saveStoredData(HFOS_STORAGE_KEYS.household, household);
  saveStoredData(HFOS_STORAGE_KEYS.accounts, [{ id: `${userId}-private`, householdId: household.id, visibility: "private" }]);
  saveStoredData(HFOS_STORAGE_KEYS.memberPersonalAccounts, [{ id: `${userId}-archive`, householdId: household.id }]);
  saveStoredData(HFOS_STORAGE_KEYS.transactions, [{ id: `${userId}-transaction`, householdId: household.id, amount: 123.45 }]);
}

test("Dadi, Rasha and Lyn have distinct storage including all collection and attachment keys", () => {
  setup();
  for (const user of ["dadi", "rasha", "lyn"]) {
    applicationStorageScope.select(user);
    for (const key of Object.values(HFOS_STORAGE_KEYS)) {
      assert.equal(getApplicationStorage()!.getItem(key), null);
      getApplicationStorage()!.setItem(key, JSON.stringify({ owner: user, dataUrl: `${user}-file` }));
    }
  }
  for (const user of ["dadi", "rasha", "lyn"]) {
    applicationStorageScope.select(user);
    for (const key of Object.values(HFOS_STORAGE_KEYS)) {
      assert.equal(JSON.parse(getApplicationStorage()!.getItem(key)!).owner, user);
    }
  }
});

test("signed-out storage fails closed and retained old-session handles cannot read or write", () => {
  setup();
  seed("dadi");
  const old = getApplicationStorage()!;
  applicationStorageScope.lock();
  assert.equal(getApplicationStorage(), null);
  assert.equal(saveStoredData(HFOS_STORAGE_KEYS.accounts, []).success, false);
  assert.throws(() => old.getItem(HFOS_STORAGE_KEYS.accounts), /session changed/);
  applicationStorageScope.select("rasha");
  assert.throws(() => old.setItem(HFOS_STORAGE_KEYS.accounts, "stale"), /session changed/);
  assert.equal(getApplicationStorage()!.getItem(HFOS_STORAGE_KEYS.accounts), null);
  applicationStorageScope.select("dadi");
  assert.throws(() => old.clear(), /session changed/);
  assert.match(getApplicationStorage()!.getItem(HFOS_STORAGE_KEYS.accounts)!, /dadi-private/);
});

test("enumeration and clear affect only the selected namespace and leave auth and legacy data untouched", () => {
  const raw = new MemoryStorage();
  raw.setItem("sb-test-auth-token", "auth-test-fixture");
  raw.setItem(HFOS_STORAGE_KEYS.accounts, "legacy-original");
  const scope = new UserScopedStorage();
  scope.select("dadi");
  scope.view(raw)!.setItem(HFOS_STORAGE_KEYS.accounts, "dadi-records");
  scope.select("rasha");
  const view = scope.view(raw)!;
  view.setItem(HFOS_STORAGE_KEYS.accounts, "rasha-records");
  assert.equal(view.length, 1);
  assert.equal(view.key(0), HFOS_STORAGE_KEYS.accounts);
  view.clear();
  scope.select("dadi");
  assert.equal(scope.view(raw)!.getItem(HFOS_STORAGE_KEYS.accounts), "dadi-records");
  assert.equal(raw.getItem(HFOS_STORAGE_KEYS.accounts), "legacy-original");
  assert.equal(raw.getItem("sb-test-auth-token"), "auth-test-fixture");
});

test("scope prefixes do not collide for encoded user identifiers", () => {
  const scope = new UserScopedStorage();
  const raw = new MemoryStorage();
  for (const id of ["a", "a:b", "a%3Ab"]) {
    scope.select(id);
    assert.equal(scope.view(raw)!.getItem("record"), null);
    scope.view(raw)!.setItem("record", id);
  }
  for (const id of ["a", "a:b", "a%3Ab"]) {
    scope.select(id);
    assert.equal(scope.view(raw)!.getItem("record"), id);
  }
});

test("backup export is user-bound and excludes other users and unclaimed legacy content", async () => {
  const { localStorage } = setup();
  localStorage.setItem(HFOS_STORAGE_KEYS.accounts, "legacy-secret");
  seed("dadi");
  seed("rasha");
  const result = await createApplicationBackup();
  assert.equal(result.success, true);
  const backup = JSON.parse(result.json!);
  assert.equal(backup.storageOwnerUserId, "rasha");
  assert.match(result.json!, /rasha-private/);
  assert.doesNotMatch(result.json!, /dadi-private|legacy-secret/);
});

test("foreign and unbound backups cannot replace the signed-in user's records", async () => {
  setup();
  seed("dadi");
  const backup = await createApplicationBackup();
  seed("rasha");
  const before = getApplicationStorage()!.getItem(HFOS_STORAGE_KEYS.accounts);
  const denied = await restoreApplicationBackup(backup.json!);
  assert.equal(denied.success, false);
  assert.match(denied.message, /different signed-in user/);
  const legacy = JSON.parse(backup.json!);
  delete legacy.storageOwnerUserId;
  assert.equal((await restoreApplicationBackup(JSON.stringify(legacy))).success, false);
  assert.equal(getApplicationStorage()!.getItem(HFOS_STORAGE_KEYS.accounts), before);
});

test("same-user backup survives a new browser while retaining personal archive identity", async () => {
  setup();
  seed("rasha");
  const backup = await createApplicationBackup();
  setup();
  applicationStorageScope.select("rasha");
  assert.equal((await restoreApplicationBackup(backup.json!)).success, true);
  assert.match(getApplicationStorage()!.getItem(HFOS_STORAGE_KEYS.accounts)!, /rasha-private/);
  assert.match(getApplicationStorage()!.getItem(HFOS_STORAGE_KEYS.memberPersonalAccounts)!, /rasha-archive/);
});

test("legacy owner-linked backups restore only for their recorded linking user", async () => {
  setup();
  seed("dadi");
  const backup = JSON.parse((await createApplicationBackup()).json!);
  delete backup.storageOwnerUserId;
  assert.equal((await restoreApplicationBackup(JSON.stringify(backup))).success, true);
  applicationStorageScope.select("rasha");
  assert.equal((await restoreApplicationBackup(JSON.stringify(backup))).success, false);
  applicationStorageScope.select("dadi");
  delete backup.records[HFOS_STORAGE_KEYS.household].authenticatedLink;
  assert.equal((await restoreApplicationBackup(JSON.stringify(backup))).success, false);
});

test("conflicting backup owner and household link cannot rebind another user's household", async () => {
  setup();
  seed("dadi");
  const backup = JSON.parse((await createApplicationBackup()).json!);
  backup.storageOwnerUserId = "rasha";
  applicationStorageScope.select("rasha");
  assert.equal((await restoreApplicationBackup(JSON.stringify(backup))).success, false);
});

test("password-protected backups enforce the same user boundary", async () => {
  setup();
  seed("dadi");
  const backup = await createApplicationBackup({ password: "test-only-passphrase" });
  assert.equal(backup.success, true);
  seed("lyn");
  assert.equal((await restoreApplicationBackup(backup.json!, "test-only-passphrase")).success, false);
  applicationStorageScope.select("dadi");
  assert.equal((await restoreApplicationBackup(backup.json!, "test-only-passphrase")).success, true);
});

test("switching user while restore validation is pending cannot write into the new user's cache", async () => {
  setup();
  seed("dadi");
  const backup = await createApplicationBackup();
  const pending = restoreApplicationBackup(backup.json!);
  seed("rasha");
  assert.equal((await pending).success, false);
  assert.match(getApplicationStorage()!.getItem(HFOS_STORAGE_KEYS.accounts)!, /rasha-private/);
});

test("reset and clear-test-data do not clear another user's cache or the legacy quarantine", () => {
  const { localStorage } = setup();
  localStorage.setItem(HFOS_STORAGE_KEYS.accounts, "legacy-original");
  seed("dadi");
  seed("rasha");
  assert.equal(resetHouseholdTestData().success, true);
  assert.equal(resetApplicationData().success, true);
  applicationStorageScope.select("dadi");
  assert.match(getApplicationStorage()!.getItem(HFOS_STORAGE_KEYS.accounts)!, /dadi-private/);
  assert.equal(localStorage.getItem(HFOS_STORAGE_KEYS.accounts), "legacy-original");
});

test("local unauthenticated mode retains its original storage format", () => {
  const { localStorage } = installBrowserStorage();
  authFeatureConfig.enabled = false;
  saveStoredData(HFOS_STORAGE_KEYS.accounts, []);
  assert.ok(localStorage.getItem(HFOS_STORAGE_KEYS.accounts));
  assert.equal(loadStoredData(HFOS_STORAGE_KEYS.accounts, Array.isArray).status, "loaded");
});
