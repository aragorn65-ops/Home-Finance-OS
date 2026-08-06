import assert from "node:assert/strict";
import test from "node:test";

import {
  createMigrationAccountUploadPayload,
} from "../src/features/auth/components/migrationAccountUpload.ts";
import type {
  Account,
} from "../src/features/accounts/models/Account.ts";

test(
  "creates account upload payload scoped to the migration household",
  () => {
    const account: Account = {
      id:
        "account-1",
      householdId:
        "household-1",
      ownerMemberId:
        "member-local-1",
      visibility:
        "household",
      name:
        "Main Cash",
      institution:
        "Wallet",
      accountClass:
        "asset",
      type:
        "cash",
      currency:
        "PHP",
      baseCurrency:
        "PHP",
      exchangeRate:
        1,
      exchangeRateEffectiveDate:
        new Date(
          "2026-07-20T00:00:00Z"
        ),
      exchangeRateSource:
        "manual",
      openingBalance:
        100,
      currentBalance:
        150,
      openingBaseBalance:
        100,
      currentBaseBalance:
        150,
      isActive:
        true,
      createdAt:
        new Date(
          "2026-07-20T01:00:00Z"
        ),
      updatedAt:
        new Date(
          "2026-07-20T02:00:00Z"
        ),
    };

    const payload =
      createMigrationAccountUploadPayload(
        [
          account,
          {
            ...account,
            id:
              "account-other",
            householdId:
              "household-2",
          },
        ],
        "household-1"
      );

    assert.equal(
      payload.expectedAccountCount,
      1
    );
    assert.deepEqual(
      payload.accounts,
      [
        {
          id:
            "account-1",
          ownerMemberId:
            "member-local-1",
          visibility:
            "household",
          name:
            "Main Cash",
          institution:
            "Wallet",
          accountClass:
            "asset",
          type:
            "cash",
          currency:
            "PHP",
          baseCurrency:
            "PHP",
          exchangeRate:
            1,
          exchangeRateEffectiveDate:
            "2026-07-20",
          exchangeRateSource:
            "manual",
          exchangeRateProvider:
            undefined,
          openingBalance:
            100,
          currentBalance:
            150,
          openingBaseBalance:
            100,
          currentBaseBalance:
            150,
          accountNumber:
            undefined,
          creditLimit:
            undefined,
          statementBalance:
            undefined,
          minimumPayment:
            undefined,
          paymentDueDate:
            undefined,
          isActive:
            true,
          createdAt:
            "2026-07-20T01:00:00.000Z",
          updatedAt:
            "2026-07-20T02:00:00.000Z",
        },
      ]
    );
  }
);
