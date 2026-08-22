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
