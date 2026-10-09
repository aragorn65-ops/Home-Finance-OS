import assert from "node:assert/strict";
import test from "node:test";
import "fake-indexeddb/auto";
import {
  AttachmentContentStore, attachmentContentStore, stageAttachmentDataUrl,
  type AttachmentContentBackend,
} from "../src/shared/storage/attachmentContentStore.ts";
import { MemoryStorage, installBrowserStorage, createStorageEnvelope, createLinkedHousehold } from "./storageTestUtils.ts";
import { HFOS_STORAGE_KEYS, saveStoredData, loadStoredData } from "../src/shared/storage/localStorageStore.ts";
import { createApplicationBackup, restoreApplicationBackup } from "../src/features/startup/services/applicationBackup.ts";

function backend(): AttachmentContentBackend {
  const files = new Map<string, string>();
  return {
    async readAll() { return Array.from(files, ([key, dataUrl]) => ({ key, dataUrl })); },
    async write(key, dataUrl) { files.set(key, dataUrl); },
    async read(key) { return files.get(key); },
  };
}
const dataUrl = "data:image/png;base64," + "YWJj".repeat(10000);
const attachment = { id: "receipt", fileName: "receipt.png", mimeType: "image/png", dataUrl, sizeBytes: 30000,
  category: "receipt", createdAt: "2026-10-05T00:00:00.000Z" };
const record = [{ id: "payment", amount: 9260.13, fromMemberId: "rasha", toMemberId: "dadi", attachments: [attachment] }];

test("migration verifies durable content, reduces localStorage and preserves all fields on reopening", async () => {
  const storage = new MemoryStorage();
  const durable = backend();
  const store = new AttachmentContentStore(durable);
  const envelope = createStorageEnvelope(record);
  const original = JSON.stringify(envelope);
  storage.setItem("payments", original);
  storage.setItem("unrelated", original);
  await store.migrate(storage, ["payments"]);
  const compact = storage.getItem("payments")!;
  assert.ok(compact.length < original.length / 10);
  assert.equal(storage.getItem("unrelated"), original);
  const reopened = new AttachmentContentStore(durable);
  await reopened.refresh();
  assert.deepEqual(reopened.decode(JSON.parse(compact)), envelope);
  await reopened.migrate(storage, ["payments"]);
  assert.equal(storage.getItem("payments"), compact);
});

test("failed IndexedDB writes and failed read-back verification retain original inline records", async () => {
  for (const failure of ["write", "verify"]) {
    const durable = backend();
    if (failure === "write") durable.write = async () => { throw new Error("quota"); };
    else durable.read = async () => "corrupted";
    const store = new AttachmentContentStore(durable);
    const storage = new MemoryStorage();
    const original = JSON.stringify(createStorageEnvelope(record));
    storage.setItem("payments", original);
    await assert.rejects(store.migrate(storage, ["payments"]));
    assert.equal(storage.getItem("payments"), original);
    assert.deepEqual(store.encode(record), record);
  }
});

test("localStorage migration failure keeps inline bytes recoverable", async () => {
  const storage = new MemoryStorage();
  const original = JSON.stringify(createStorageEnvelope(record));
  storage.setItem("payments", original);
  storage.setItem = () => { throw new Error("blocked"); };
  await assert.rejects(new AttachmentContentStore(backend()).migrate(storage, ["payments"]));
  assert.equal(storage.getItem("payments"), original);
});

test("migration does not overwrite a concurrent record edit", async () => {
  const storage = new MemoryStorage();
  storage.setItem("payments", JSON.stringify(createStorageEnvelope(record)));
  const durable = backend();
  const write = durable.write;
  const newer = JSON.stringify(createStorageEnvelope([{ ...record[0], amount: 100 }]));
  durable.write = async (key, content) => { await write(key, content); storage.setItem("payments", newer); };
  await new AttachmentContentStore(durable).migrate(storage, ["payments"]);
  assert.equal(storage.getItem("payments"), newer);
});

test("missing references fail closed instead of exporting empty receipt content", async () => {
  const store = new AttachmentContentStore(backend());
  await store.stageRecords(record);
  const encoded = store.encode(record);
  assert.throws(() => new AttachmentContentStore(backend()).decode(encoded), /Receipt content is not loaded/);
});

test("native IndexedDB adapter stages receipts before local save and produces portable backups", async () => {
  const { localStorage } = installBrowserStorage();
  saveStoredData(HFOS_STORAGE_KEYS.household, createLinkedHousehold());
  const settlement = [{ ...record[0], householdId: "household-local-1" }];
  await stageAttachmentDataUrl(dataUrl);
  const write = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, value) => {
    if (value.length > 10000) throw new DOMException("Full", "QuotaExceededError");
    write(key, value);
  };
  assert.equal(saveStoredData(HFOS_STORAGE_KEYS.settlements, settlement).success, true);
  assert.ok(!localStorage.getItem(HFOS_STORAGE_KEYS.settlements)!.includes(dataUrl));
  await attachmentContentStore.refresh();
  const loaded = loadStoredData(HFOS_STORAGE_KEYS.settlements, (value): value is typeof settlement => Array.isArray(value));
  assert.deepEqual(loaded.data, settlement);
  const backup = await createApplicationBackup();
  assert.equal(backup.success, true, backup.message);
  assert.ok(backup.json?.includes(dataUrl));
  assert.ok(!backup.json?.includes("hfos-attachment:v1:"));
  const restored = await restoreApplicationBackup(backup.json!);
  assert.equal(restored.success, true, restored.message);
  assert.deepEqual(loadStoredData(HFOS_STORAGE_KEYS.settlements, (value): value is typeof settlement => Array.isArray(value)).data, settlement);
});

test("a tab cannot overwrite an unresolved reference from another tab", () => {
  const { localStorage } = installBrowserStorage();
  const unresolved = [{ ...record[0], attachments: [{ ...attachment, dataUrl: "hfos-attachment:v1:missing" }] }];
  const original = JSON.stringify(createStorageEnvelope(unresolved));
  localStorage.setItem(HFOS_STORAGE_KEYS.settlements, original);
  assert.throws(() => loadStoredData(HFOS_STORAGE_KEYS.settlements, (value): value is unknown[] => Array.isArray(value)), /Receipt content/);
  assert.equal(saveStoredData(HFOS_STORAGE_KEYS.settlements, []).success, false);
  assert.equal(localStorage.getItem(HFOS_STORAGE_KEYS.settlements), original);
});

test("native IndexedDB transaction abort never authorizes a compact reference", async () => {
  const content = "data:image/png;base64,YWJvcnQ=";
  const file = { ...attachment, dataUrl: content };
  const put = IDBObjectStore.prototype.put;
  try {
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args);
      queueMicrotask(() => this.transaction.abort());
      return request;
    };
    await assert.rejects(stageAttachmentDataUrl(content));
    assert.equal(attachmentContentStore.encode(file).dataUrl, content);
  } finally {
    IDBObjectStore.prototype.put = put;
  }
});
