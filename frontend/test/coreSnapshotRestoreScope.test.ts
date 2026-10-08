import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { CoreSnapshotRestoreScope, getCoreSnapshotRestoreScopeKey } from "../src/features/auth/services/coreSnapshotRestoreScope.ts";

const key = (userId: string | undefined, status = "signed-in", role = "member") =>
  getCoreSnapshotRestoreScopeKey("local", "remote", userId, status, role);

test("same-role member switch requires a new initial cloud restore", () => {
  const scope = new CoreSnapshotRestoreScope();
  const rasha = scope.select(key("rasha"));
  scope.markRestored(rasha);
  assert.equal(scope.isRestored(), true);
  scope.select(key("lyn"));
  assert.equal(scope.isRestored(), false);
  assert.equal(scope.isCurrent(rasha), false);
  scope.markRestored(rasha);
  assert.equal(scope.isRestored(), false);
});

test("returning to a previously signed-in member never reuses another member's loaded data", () => {
  const scope = new CoreSnapshotRestoreScope();
  const old = scope.select(key("rasha"));
  scope.markRestored(old);
  scope.markRestored(scope.select(key("lyn")));
  scope.select(key("rasha"));
  assert.equal(scope.isRestored(), false);
  assert.equal(scope.isCurrent(old), false);
});

test("sign-out and role changes invalidate restored state", () => {
  const scope = new CoreSnapshotRestoreScope();
  scope.markRestored(scope.select(key("rasha")));
  scope.select(key(undefined, "signed-out"));
  assert.equal(scope.isRestored(), false);
  scope.markRestored(scope.select(key("rasha")));
  scope.select(key("rasha", "signed-in", "viewer"));
  assert.equal(scope.isRestored(), false);
});

test("same-session background refresh preserves restored state and open forms", () => {
  const scope = new CoreSnapshotRestoreScope();
  const generation = scope.select(key("rasha"));
  scope.markRestored(generation);
  assert.equal(scope.select(key("rasha")), generation);
  assert.equal(scope.isRestored(), true);
});

test("hook receives user identity and fences pending writes and initial rendering", () => {
  const shell = readFileSync(new URL("../src/app/AppShell/AppShell.tsx", import.meta.url), "utf8");
  const hook = readFileSync(new URL("../src/features/auth/hooks/useLinkedCoreSnapshotRestore.ts", import.meta.url), "utf8");
  assert.match(shell, /useLinkedCoreSnapshotRestore\(\{[\s\S]*?sessionUserId: session\.user\?\.id/);
  assert.match(hook, /isCurrent: \(\) => isActive && restoreScope\.current\.isCurrent\(scopeGeneration\)/);
  assert.match(hook, /isRestoring: isRestoring \|\| \(shouldRestore && !restoreScope\.current\.isRestored\(\) && !error\)/);
});
