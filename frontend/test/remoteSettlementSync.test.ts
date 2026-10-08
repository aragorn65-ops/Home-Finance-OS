import assert from "node:assert/strict";
import test from "node:test";

import {
  createStorageEnvelope,
  installBrowserStorage,
} from "./storageTestUtils.ts";
import {
  HFOS_STORAGE_KEYS,
} from "../src/shared/storage/localStorageStore.ts";
import SettlementRepository from "../src/features/settlements/repositories/SettlementRepository.ts";
import SettlementApplicationRepository from "../src/features/settlements/repositories/SettlementApplicationRepository.ts";
import {
  persistRemoteSettlementRecords,
} from "../src/features/settlements/services/remoteSettlementSync.ts";

for (const failedKey of [HFOS_STORAGE_KEYS.settlements, HFOS_STORAGE_KEYS.settlementApplications]) {
  test(`remote refresh preserves both cached collections when ${failedKey} cannot be written`, () => {
    const { localStorage } = installBrowserStorage();
    const householdId = `quota-${failedKey}`;
    const now = new Date("2026-10-05T00:00:00Z");
    localStorage.setItem(HFOS_STORAGE_KEYS.household, JSON.stringify(createStorageEnvelope({
      id: householdId, householdName: "Quota fixture", country: "PH", currency: "PHP",
      timezone: "Asia/Manila", members: [], createdAt: now.toISOString(), updatedAt: now.toISOString(),
    })));
    const settlement = { id: "paid", householdId, fromMemberId: "rasha", toMemberId: "dadi",
      amount: 100, settlementDate: now, applicationMethod: "manual" as const, attachments: [],
      isActive: true, createdAt: now, updatedAt: now };
    const application = { id: "link", settlementId: settlement.id, expenseAllocationId: "expense",
      appliedAmount: 100, createdAt: now, updatedAt: now };
    assert.ok(SettlementRepository.create(settlement));
    assert.ok(SettlementApplicationRepository.create(application));
    const beforePayments = localStorage.getItem(HFOS_STORAGE_KEYS.settlements);
    const beforeLinks = localStorage.getItem(HFOS_STORAGE_KEYS.settlementApplications);
    const write = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key, value) => {
      if (key === failedKey) throw new DOMException("Quota exhausted", "QuotaExceededError");
      write(key, value);
    };
    assert.throws(() => persistRemoteSettlementRecords(householdId,
      [{ ...settlement, id: "remote", localRecordId: settlement.id }],
      [{ ...settlement, notes: "remote update" }],
      [{ ...application, householdId, settlementId: "remote" }]), /Browser storage is full/);
    assert.equal(localStorage.getItem(HFOS_STORAGE_KEYS.settlements), beforePayments);
    assert.equal(localStorage.getItem(HFOS_STORAGE_KEYS.settlementApplications), beforeLinks);
    assert.deepEqual(SettlementRepository.findById(settlement.id), settlement);
    assert.deepEqual(SettlementApplicationRepository.findBySettlementId(settlement.id), [application]);
    // Reopening the repositories also sees the original complete payment state.
    localStorage.setItem = write;
    SettlementRepository.reloadFromStorage();
    SettlementApplicationRepository.reloadFromStorage();
    assert.deepEqual(SettlementRepository.findById(settlement.id), settlement);
    assert.deepEqual(SettlementApplicationRepository.findBySettlementId(settlement.id), [application]);
  });
}

test(
  "remote settlement sync clears local history when cloud has none",
  () => {
    const { localStorage } =
      installBrowserStorage();
    const householdId =
      "household-remote-settlement-clear";

    localStorage.setItem(
      HFOS_STORAGE_KEYS.household,
      JSON.stringify(
        createStorageEnvelope({
          id:
            householdId,
          householdName:
            "Remote Settlement Clear",
          country:
            "PH",
          currency:
            "PHP",
          timezone:
            "Asia/Manila",
          members: [],
          createdAt:
            "2026-08-22T00:00:00.000Z",
          updatedAt:
            "2026-08-22T00:00:00.000Z",
        })
      )
    );

    SettlementRepository.create({
      id:
        "settlement-local-stale",
      householdId,
      fromMemberId:
        "member-rasha",
      toMemberId:
        "member-owner",
      amount:
        100,
      settlementDate:
        new Date(
          "2026-08-22T00:00:00.000Z"
        ),
      applicationMethod:
        "oldest-first",
      attachments: [],
      isActive:
        true,
      createdAt:
        new Date(
          "2026-08-22T00:00:00.000Z"
        ),
      updatedAt:
        new Date(
          "2026-08-22T00:00:00.000Z"
        ),
    });
    SettlementApplicationRepository.create({
      id:
        "settlement-application-local-stale",
      settlementId:
        "settlement-local-stale",
      expenseAllocationId:
        "allocation-local-stale",
      appliedAmount:
        100,
      createdAt:
        new Date(
          "2026-08-22T00:00:00.000Z"
        ),
      updatedAt:
        new Date(
          "2026-08-22T00:00:00.000Z"
        ),
    });

    persistRemoteSettlementRecords(
      householdId,
      [],
      [],
      []
    );

    assert.equal(
      SettlementRepository.findByHouseholdId(
        householdId
      ).length,
      0
    );
    assert.equal(
      SettlementApplicationRepository
        .findBySettlementId(
          "settlement-local-stale"
        ).length,
      0
    );
  }
);

test(
  "remote settlement sync preserves local applications when cloud applications are unavailable",
  () => {
    const { localStorage } = installBrowserStorage();
    const householdId = "household-member-settlement-sync";
    const now = new Date("2026-09-03T06:39:35.000Z");

    localStorage.setItem(HFOS_STORAGE_KEYS.household, JSON.stringify(
      createStorageEnvelope({
        id: householdId,
        householdName: "Member Settlement Sync",
        country: "PH",
        currency: "PHP",
        timezone: "Asia/Manila",
        members: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
    ));

    const settlement = {
      id: "settlement-with-applications",
      householdId,
      fromMemberId: "member-rasha",
      toMemberId: "member-owner",
      amount: 1000,
      settlementDate: now,
      applicationMethod: "manual" as const,
      referenceNumber: "SET-20260903-143935",
      attachments: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    SettlementRepository.create(settlement);
    SettlementApplicationRepository.create({
      id: "local-payment-link",
      settlementId: settlement.id,
      expenseAllocationId: "allocation-august",
      appliedAmount: 900,
      createdAt: now,
      updatedAt: now,
    });

    persistRemoteSettlementRecords(
      householdId,
      [{ ...settlement, id: "remote-settlement", localRecordId: settlement.id }],
      [settlement],
      []
    );

    assert.deepEqual(
      SettlementApplicationRepository.findBySettlementId(settlement.id)
        .map((application) => [application.expenseAllocationId, application.appliedAmount]),
      [["allocation-august", 900]]
    );
  }
);
