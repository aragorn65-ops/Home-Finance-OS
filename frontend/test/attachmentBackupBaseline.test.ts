import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import "fake-indexeddb/auto";
import { attachmentContentStore } from "../src/shared/storage/attachmentContentStore.ts";
import { HFOS_STORAGE_KEYS } from "../src/shared/storage/localStorageStore.ts";
import { createApplicationBackup, restoreApplicationBackup } from "../src/features/startup/services/applicationBackup.ts";
import { installBrowserStorage, createStorageEnvelope } from "./storageTestUtils.ts";
import SettlementService from "../src/features/settlements/services/SettlementService.ts";
import SettlementRepository from "../src/features/settlements/repositories/SettlementRepository.ts";

// Opt-in, read-only verification of a user's portable backup in an isolated emulator.
test("backup migration and restore preserve every financial record and receipt", {
  skip: !process.env.HFOS_BACKUP_VERIFY_PATH,
}, async () => {
  const source = await readFile(process.env.HFOS_BACKUP_VERIFY_PATH!, "utf8");
  const original = JSON.parse(source);
  const { localStorage } = installBrowserStorage();
  for (const [key, data] of Object.entries(original.records)) {
    localStorage.setItem(key, JSON.stringify(createStorageEnvelope(data)));
  }
  const size = () => Object.values(HFOS_STORAGE_KEYS).reduce((sum, key) => sum + (localStorage.getItem(key)?.length ?? 0), 0);
  const before = size();
  await attachmentContentStore.migrate(localStorage, Object.values(HFOS_STORAGE_KEYS));
  const after = size();
  assert.ok(after < before);
  const backup = await createApplicationBackup();
  assert.equal(backup.success, true, backup.message);
  assert.deepEqual(JSON.parse(backup.json!).records, original.records);
  assert.equal((await restoreApplicationBackup(backup.json!)).success, true);
  const exportedAgain = await createApplicationBackup();
  assert.deepEqual(JSON.parse(exportedAgain.json!).records, original.records);

  // Reproduce the reported edits under a quota too small for an inline receipt.
  const write = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, value) => {
    const total = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)!)
      .filter(existing => existing !== key)
      .reduce((sum, existing) => sum + localStorage.getItem(existing)!.length, value.length);
    if (total > 500000) throw new DOMException("Storage full", "QuotaExceededError");
    write(key, value);
  };
  const receipt = { id: "quota-proof-receipt", category: "receipt" as const,
    fileName: "synthetic-quota-test.png", mimeType: "image/png", sizeBytes: 900000,
    dataUrl: "data:image/png;base64," + "YWJj".repeat(300000), createdAt: new Date() };
  await attachmentContentStore.stage(receipt.dataUrl);
  const linksBefore = localStorage.getItem(HFOS_STORAGE_KEYS.settlementApplications);
  for (const amount of [373.36, 9260.13]) {
    const raw = original.records[HFOS_STORAGE_KEYS.settlements].find((record: { amount: number }) => record.amount === amount);
    assert.ok(raw, `Expected baseline payment ${amount}`);
    const payment = SettlementService.getSettlementById(raw.id)!;
    assert.ok(payment);
    const applications = SettlementService.getApplications(payment.id);
    const result = SettlementService.update(payment.id, {
      householdId: payment.householdId, fromMemberId: payment.fromMemberId, toMemberId: payment.toMemberId,
      amount: payment.amount, settlementDate: [payment.settlementDate.getFullYear(),
        String(payment.settlementDate.getMonth() + 1).padStart(2, "0"),
        String(payment.settlementDate.getDate()).padStart(2, "0")].join("-"),
      sourceAccountId: payment.sourceAccountId ?? "", destinationAccountId: payment.destinationAccountId ?? "",
      applicationMethod: payment.applicationMethod, referenceNumber: payment.referenceNumber ?? "",
      notes: payment.notes ?? "", isActive: payment.isActive,
      attachments: [...(payment.attachments ?? []), { ...receipt, id: `receipt-${payment.id}` }],
      applications: payment.applicationMethod === "manual"
        ? applications.map(application => ({ ...application, isSelected: true })) : [],
    });
    assert.equal(result.success, true, JSON.stringify(result));
    SettlementRepository.reloadFromStorage();
    const reopened = SettlementService.getSettlementById(payment.id)!;
    assert.equal(reopened.amount, amount);
    assert.equal(reopened.fromMemberId, payment.fromMemberId);
    assert.equal(reopened.toMemberId, payment.toMemberId);
    assert.equal(reopened.settlementDate.toISOString(), payment.settlementDate.toISOString());
    assert.equal(reopened.attachments?.at(-1)?.dataUrl, receipt.dataUrl);
    assert.deepEqual(SettlementService.getApplications(payment.id), applications);
  }
  assert.equal(localStorage.getItem(HFOS_STORAGE_KEYS.settlementApplications), linksBefore);
  const receiptBackup = await createApplicationBackup();
  assert.equal(receiptBackup.success, true, receiptBackup.message);
  assert.ok(receiptBackup.json!.includes(receipt.dataUrl));
  for (const [key, data] of Object.entries(original.records)) {
    if (key !== HFOS_STORAGE_KEYS.settlements) assert.deepEqual(JSON.parse(receiptBackup.json!).records[key], data);
  }
  assert.equal(await readFile(process.env.HFOS_BACKUP_VERIFY_PATH!, "utf8"), source);
  console.log(`Read-only backup verification: local records reduced from ${before} to ${after} characters; all records and receipt bytes unchanged.`);
});
