import assert from "node:assert/strict";
import test from "node:test";
import { restoreLinkedRemoteCoreSnapshot } from "../src/features/auth/services/coreSnapshotSync.ts";
import type { RemoteHouseholdCoreSnapshot } from "../src/features/auth/models/RemoteCoreSnapshot.ts";
import { getSettlementPreviews } from "../src/features/dashboard/services/settlementPreviews.ts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function snapshot(householdId: string, share: number): RemoteHouseholdCoreSnapshot {
  const date = "2026-08-30T00:00:00.000Z";
  return { householdId, accounts: [], transactions: [{ id: "electricity", type: "expense", amount: share,
    sourceAccountId: null, destinationAccountId: null, category: "Electricity", description: "Electricity",
    notes: "", transactionDate: "2026-08-30", visibility: "household", isActive: true, createdAt: date, updatedAt: date }],
    expenseAllocations: [{ id: "electricity-share", transactionId: "electricity", paidByMemberId: "owner",
      memberId: "rasha", isIncluded: true, allocatedAmount: share, createdAt: date, updatedAt: date }] };
}

function fixture(remoteHouseholdId: string) {
  let share = 0;
  let writes = 0;
  const writer = {
    replaceAccounts: () => { writes += 1; return true; },
    replaceTransactions: () => true,
    replaceExpenseAllocations: (_id: string, allocations: { allocatedAmount: number }[]) => {
      share = allocations[0].allocatedAmount; return true;
    },
  };
  const preview = () => getSettlementPreviews([3402.74, share].map((amount, index) => ({
    expenseAllocationId: `share-${index}`, transactionId: `expense-${index}`,
    fromMemberId: "rasha", toMemberId: "owner", transactionDate: new Date("2026-08-30"),
    category: "Electricity", description: "", allocatedAmount: amount, paidAmount: 0,
    outstandingAmount: amount, paymentStatus: "unpaid" as const,
  })), (id) => id)[0].amount;
  return { household: { id: `local-${remoteHouseholdId}`, authenticatedLink: { remoteHouseholdId, ownerMemberId: "owner" } },
    writer, preview, writes: () => writes };
}

test("late stale snapshot cannot roll the dashboard back from 7092.09 to 7092.07", async () => {
  const id = "restore-order";
  const f = fixture(id);
  const old = deferred<RemoteHouseholdCoreSnapshot>();
  const started = deferred<void>();
  let calls = 0;
  const adapter = {
    async loadRemoteCoreSnapshot() {
      if (++calls === 1) { started.resolve(); return old.promise; }
      return snapshot(id, 3689.35);
    },
    async saveRemoteCoreSnapshot() { throw new Error("unused"); },
  };
  const first = restoreLinkedRemoteCoreSnapshot({ authEnabled: true, ...f, adapter });
  await started.promise;
  const second = await restoreLinkedRemoteCoreSnapshot({ authEnabled: true, ...f, adapter });
  assert.equal(second.status, "restored");
  assert.equal(f.preview(), 7092.09);
  old.resolve(snapshot(id, 3689.33));
  assert.deepEqual(await first, { status: "skipped", reason: "superseded-restore" });
  assert.equal(f.preview(), 7092.09);
  assert.equal(f.writes(), 1);
});

test("cancelled route/session load cannot write data without its refresh notification", async () => {
  const id = "restore-cancelled";
  const f = fixture(id);
  const response = deferred<RemoteHouseholdCoreSnapshot>();
  const started = deferred<void>();
  let current = true;
  const pending = restoreLinkedRemoteCoreSnapshot({ authEnabled: true, ...f, isCurrent: () => current,
    adapter: {
      async loadRemoteCoreSnapshot() { started.resolve(); return response.promise; },
      async saveRemoteCoreSnapshot() { throw new Error("unused"); },
    },
  });
  await started.promise;
  current = false;
  response.resolve(snapshot(id, 3689.33));
  assert.deepEqual(await pending, { status: "skipped", reason: "superseded-restore" });
  assert.equal(f.writes(), 0);
});

test("an older load finishing first cannot cancel or replace the newer pending load", async () => {
  const id = "restore-old-first";
  const f = fixture(id);
  const responses = [deferred<RemoteHouseholdCoreSnapshot>(), deferred<RemoteHouseholdCoreSnapshot>()];
  const started = [deferred<void>(), deferred<void>()];
  let calls = 0;
  const adapter = {
    async loadRemoteCoreSnapshot() { const index = calls++; started[index].resolve(); return responses[index].promise; },
    async saveRemoteCoreSnapshot() { throw new Error("unused"); },
  };
  const old = restoreLinkedRemoteCoreSnapshot({ authEnabled: true, ...f, adapter });
  await started[0].promise;
  const latest = restoreLinkedRemoteCoreSnapshot({ authEnabled: true, ...f, adapter });
  await started[1].promise;
  responses[0].resolve(snapshot(id, 3689.33));
  assert.equal((await old).status, "skipped");
  assert.equal(f.writes(), 0);
  responses[1].resolve(snapshot(id, 3689.35));
  assert.equal((await latest).status, "restored");
  assert.equal(f.preview(), 7092.09);
});

test("a failed newest load does not let an older response overwrite data, and retry works", async () => {
  const id = "restore-failure";
  const f = fixture(id);
  const oldResponse = deferred<RemoteHouseholdCoreSnapshot>();
  const started = deferred<void>();
  let calls = 0;
  const adapter = {
    async loadRemoteCoreSnapshot() {
      if (++calls === 1) { started.resolve(); return oldResponse.promise; }
      if (calls === 2) throw new Error("Cloud unavailable");
      return snapshot(id, 3689.35);
    },
    async saveRemoteCoreSnapshot() { throw new Error("unused"); },
  };
  const old = restoreLinkedRemoteCoreSnapshot({ authEnabled: true, ...f, adapter });
  await started.promise;
  await assert.rejects(restoreLinkedRemoteCoreSnapshot({ authEnabled: true, ...f, adapter }), /Cloud unavailable/);
  oldResponse.resolve(snapshot(id, 3689.33));
  assert.equal((await old).status, "skipped");
  assert.equal(f.writes(), 0);
  assert.equal((await restoreLinkedRemoteCoreSnapshot({ authEnabled: true, ...f, adapter })).status, "restored");
  assert.equal(f.preview(), 7092.09);
});

test("independent households do not supersede each other's restore", async () => {
  const first = fixture("restore-independent-a");
  const second = fixture("restore-independent-b");
  const oldResponse = deferred<RemoteHouseholdCoreSnapshot>();
  const started = deferred<void>();
  const adapter = {
    async loadRemoteCoreSnapshot(id: string) {
      if (id === first.household.authenticatedLink.remoteHouseholdId) {
        started.resolve(); return oldResponse.promise;
      }
      return snapshot(id, 3689.35);
    },
    async saveRemoteCoreSnapshot() { throw new Error("unused"); },
  };
  const pending = restoreLinkedRemoteCoreSnapshot({ authEnabled: true, ...first, adapter });
  await started.promise;
  assert.equal((await restoreLinkedRemoteCoreSnapshot({ authEnabled: true, ...second, adapter })).status, "restored");
  oldResponse.resolve(snapshot(first.household.authenticatedLink.remoteHouseholdId, 3689.35));
  assert.equal((await pending).status, "restored");
  assert.equal(first.writes(), 1);
  assert.equal(second.writes(), 1);
});
