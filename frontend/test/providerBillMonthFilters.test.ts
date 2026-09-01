import assert from "node:assert/strict";
import test from "node:test";

import {
  createStorageEnvelope,
  installBrowserStorage,
} from "./storageTestUtils.ts";
import {
  HFOS_STORAGE_KEYS,
} from "../src/shared/storage/localStorageStore.ts";
import {
  defaultUtilityBillForm,
} from "../src/features/utilities/models/UtilityBillForm";
import type {
  UtilityProviderBill,
} from "../src/features/utilities/models/UtilityProviderBill";
import UtilityProviderBillRepository from "../src/features/utilities/repositories/UtilityProviderBillRepository";
import UtilityProviderBillService from "../src/features/utilities/services/UtilityProviderBillService";
import {
  getProviderBillsPaidInMonth,
} from "../src/features/utilities/services/providerBillMonthFilters";

function createProviderBill(
  overrides: Partial<UtilityProviderBill>
): UtilityProviderBill {
  const paidAt =
    overrides.paidAt ?? null;

  return {
    id:
      overrides.id ?? "provider-bill-1",
    householdId:
      "household-1",
    utilityType:
      "electricity",
    unit:
      "kWh",
    providerName:
      "Electric Provider",
    billingDate:
      new Date("2026-07-01T00:00:00"),
    dueDate:
      new Date("2026-07-31T00:00:00"),
    totalBillAmount:
      1000,
    ratePerUnit:
      10,
    status:
      paidAt ? "paid" : "unpaid",
    formSnapshot: {
      utilityType:
        "electricity",
      unit:
        "kWh",
      providerName:
        "Electric Provider",
      billingDate:
        "2026-07-01",
      dueDate:
        "2026-07-31",
      totalBillAmount:
        1000,
      ratePerUnit:
        10,
      totalConsumption:
        100,
      memberShares: [],
      applianceUsages: [],
      visibility:
        "household",
      description:
        "Utility bill",
      notes:
        "",
    },
    calculationSnapshot: {
      utilityType:
        "electricity",
      unit:
        "kWh",
      totalBillAmount:
        1000,
      ratePerUnit:
        10,
      totalSubmeterConsumption:
        0,
      totalApplianceConsumption:
        0,
      totalSubmeterChargeAmount:
        0,
      totalApplianceChargeAmount:
        0,
      totalFixedCompensationAmount:
        0,
      totalDirectMemberUsage:
        0,
      sharedRemainderAmount:
        1000,
      equalShareMemberCount:
        0,
      equalShareAmountPerMember:
        0,
      memberShares: [],
      totalMemberShares:
        1000,
      validationDifference:
        0,
      isBalanced:
        true,
    },
    memberShareSnapshot: [
      {
        memberId:
          "member-1",
        sharesRemainder:
          true,
        submeterConsumption:
          0,
        submeterChargeAmount:
          0,
        applianceConsumption:
          0,
        applianceChargeAmount:
          0,
        fixedCompensationAmount:
          0,
        directUsageAmount:
          0,
        equalSharedAmount:
          1000,
        finalShareAmount:
          1000,
      },
    ],
    billAttachments: [],
    paymentAttachments: [],
    paidByMemberId:
      "",
    sourceAccountId:
      "",
    paidAt,
    paymentReferenceNumber:
      "",
    transactionId:
      "",
    visibility:
      "household",
    description:
      "Utility bill",
    notes:
      "",
    isActive:
      true,
    createdAt:
      new Date("2026-07-01T00:00:00"),
    updatedAt:
      new Date("2026-07-01T00:00:00"),
    ...overrides,
  };
}

test("provider payment summary only includes payments from the selected month", () => {
  const julyPayment =
    createProviderBill({
      id: "july-payment",
      paidAt:
        new Date("2026-07-20T00:00:00"),
    });
  const augustPayment =
    createProviderBill({
      id: "august-payment",
      paidAt:
        new Date("2026-08-05T00:00:00"),
    });

  const augustPayments =
    getProviderBillsPaidInMonth(
      [
        julyPayment,
        augustPayment,
      ],
      new Date("2026-08-01T00:00:00")
    );

  assert.deepEqual(
    augustPayments.map(
      (providerBill) =>
        providerBill.id
    ),
    [
      "august-payment",
    ]
  );
});

test("provider bill duplicate check finds a misdated paid bill by billing month", () => {
  const { localStorage } =
    installBrowserStorage();
  const householdId =
    "household-utility-duplicate";

  localStorage.setItem(
    HFOS_STORAGE_KEYS.household,
    JSON.stringify(
      createStorageEnvelope({
        id:
          householdId,
        householdName:
          "Utility Duplicate",
        country:
          "PH",
        currency:
          "PHP",
        timezone:
          "Asia/Manila",
        members: [],
        createdAt:
          "2026-07-01T00:00:00.000Z",
        updatedAt:
          "2026-07-01T00:00:00.000Z",
      })
    )
  );

  UtilityProviderBillRepository.create(
    createProviderBill({
      id:
        "july-bill-paid-in-september",
      householdId,
      providerName:
        "Maynilad",
      utilityType:
        "water",
      unit:
        "m3",
      billingDate:
        new Date(
          "2026-07-15T00:00:00"
        ),
      totalBillAmount:
        4253.45,
      status:
        "paid",
      paidAt:
        new Date(
          "2026-09-01T00:00:00"
        ),
    })
  );

  const matches =
    UtilityProviderBillService
      .findPotentialDuplicates({
        ...defaultUtilityBillForm,
        utilityType:
          "water",
        unit:
          "m3",
        providerName:
          " Maynilad ",
        billingDate:
          "2026-07-01",
        totalBillAmount:
          4253.45,
      });

  assert.deepEqual(
    matches.map(
      (match) =>
        match.providerBill.id
    ),
    [
      "july-bill-paid-in-september",
    ]
  );
  assert.deepEqual(
    matches[0]?.reasons,
    [
      "same utility type",
      "same provider",
      "same billing month",
      "same bill amount",
    ]
  );
});

test("provider bill duplicate check allows another billing month", () => {
  const { localStorage } =
    installBrowserStorage();
  const householdId =
    "household-utility-not-duplicate";

  localStorage.setItem(
    HFOS_STORAGE_KEYS.household,
    JSON.stringify(
      createStorageEnvelope({
        id:
          householdId,
        householdName:
          "Utility Not Duplicate",
        country:
          "PH",
        currency:
          "PHP",
        timezone:
          "Asia/Manila",
        members: [],
        createdAt:
          "2026-07-01T00:00:00.000Z",
        updatedAt:
          "2026-07-01T00:00:00.000Z",
      })
    )
  );

  UtilityProviderBillRepository.create(
    createProviderBill({
      id:
        "july-water-bill",
      householdId,
      providerName:
        "Maynilad",
      utilityType:
        "water",
      unit:
        "m3",
      billingDate:
        new Date(
          "2026-07-15T00:00:00"
        ),
      totalBillAmount:
        4253.45,
    })
  );

  const matches =
    UtilityProviderBillService
      .findPotentialDuplicates({
        ...defaultUtilityBillForm,
        utilityType:
          "water",
        unit:
          "m3",
        providerName:
          "Maynilad",
        billingDate:
          "2026-08-01",
        totalBillAmount:
          4253.45,
      });

  assert.equal(
    matches.length,
    0
  );
});
