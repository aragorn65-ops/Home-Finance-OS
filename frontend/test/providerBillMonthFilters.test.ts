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
  Transaction,
} from "../src/features/transactions/models/Transaction";
import type {
  UtilityProviderBill,
} from "../src/features/utilities/models/UtilityProviderBill";
import ExpenseAllocationRepository from "../src/features/transactions/repositories/ExpenseAllocationRepository";
import TransactionRepository from "../src/features/transactions/repositories/TransactionRepository";
import TransactionService from "../src/features/transactions/services/TransactionService";
import SettlementApplicationRepository from "../src/features/settlements/repositories/SettlementApplicationRepository";
import SettlementRepository from "../src/features/settlements/repositories/SettlementRepository";
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

function createTransaction(
  overrides: Partial<Transaction>
): Transaction {
  return {
    id:
      overrides.id ?? "transaction-1",
    householdId:
      overrides.householdId ??
      "household-1",
    createdByMemberId:
      "member-1",
    paidByMemberId:
      "member-1",
    expenseSplitMethod:
      "equal",
    visibility:
      "household",
    type:
      "expense",
    amount:
      1000,
    enteredAmount:
      1000,
    enteredCurrency:
      "PHP",
    baseCurrency:
      "PHP",
    baseAmount:
      1000,
    exchangeRate:
      1,
    exchangeRateEffectiveDate:
      new Date(
        "2026-07-13T00:00:00"
      ),
    exchangeRateSource:
      "manual",
    sourceAccountId:
      null,
    destinationAccountId:
      null,
    category:
      "Water",
    description:
      "Water utility bill",
    notes:
      "",
    attachments: [],
    transactionDate:
      new Date(
        "2026-07-13T00:00:00"
      ),
    isActive:
      true,
    createdAt:
      new Date(
        "2026-07-13T00:00:00"
      ),
    updatedAt:
      new Date(
        "2026-07-13T00:00:00"
      ),
    ...overrides,
  };
}

function formatLocalDateKey(
  date: Date
): string {
  const year =
    date.getFullYear();
  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");
  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

test("saving an unpaid provider bill persists it for reload", async () => {
  const { localStorage } =
    installBrowserStorage();
  const householdId =
    "household-unpaid-provider-bill";

  localStorage.setItem(
    HFOS_STORAGE_KEYS.household,
    JSON.stringify(
      createStorageEnvelope({
        id:
          householdId,
        householdName:
          "Unpaid Provider Bill",
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

  const result =
    await UtilityProviderBillService
      .createUnpaid(
        {
          ...defaultUtilityBillForm,
          utilityType:
            "water",
          unit:
            "m3",
          providerName:
            "Manila Water",
          billingDate:
            "2026-07-13",
          dueDate:
            "2026-07-25",
          totalBillAmount:
            1409.2,
          ratePerUnit:
            1,
        },
        {
          ...createProviderBill({
            householdId,
            providerName:
              "Manila Water",
            utilityType:
              "water",
            unit:
              "m3",
          }).calculationSnapshot,
          utilityType:
            "water",
          unit:
            "m3",
          totalBillAmount:
            1409.2,
          ratePerUnit:
            1,
          sharedRemainderAmount:
            1409.2,
          totalMemberShares:
            1409.2,
          memberShares: [
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
                1409.2,
              finalShareAmount:
                1409.2,
            },
          ],
        }
      );

  assert.equal(
    result.success,
    true
  );
  assert.deepEqual(
    UtilityProviderBillService
      .getActiveProviderBills()
      .map(
        (providerBill) =>
          providerBill.providerName
      ),
    [
      "Manila Water",
    ]
  );
});

test("marking a provider bill paid keeps it out of unpaid bills after reload", async () => {
  const { localStorage } =
    installBrowserStorage();
  const householdId =
    "household-provider-bill-paid-loop";
  const transactionId =
    "paid-water-transaction";

  localStorage.setItem(
    HFOS_STORAGE_KEYS.household,
    JSON.stringify(
      createStorageEnvelope({
        id:
          householdId,
        householdName:
          "Provider Bill Paid Loop",
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

  TransactionRepository.replaceForHousehold(
    householdId,
    [
      createTransaction({
        id:
          transactionId,
        householdId,
        paidByMemberId:
          "member-1",
        amount:
          1409.2,
        category:
          "Water",
        description:
          "Water utility bill",
        transactionDate:
          new Date(
            "2026-07-13T00:00:00"
          ),
      }),
    ]
  );

  UtilityProviderBillRepository.create(
    createProviderBill({
      id:
        "paid-loop-water-bill",
      householdId,
      providerName:
        "Manila Water",
      utilityType:
        "water",
      unit:
        "m3",
      billingDate:
        new Date(
          "2026-07-13T00:00:00"
        ),
      totalBillAmount:
        1409.2,
      status:
        "unpaid",
      paidAt:
        null,
    })
  );

  const result =
    await UtilityProviderBillService
      .markPaid(
        "paid-loop-water-bill",
        {
          paidByMemberId:
            "member-1",
          sourceAccountId:
            "",
          paidAt:
            "2026-07-13",
          referenceNumber:
            "",
          paymentAttachments: [],
        }
      );

  assert.equal(
    result.success,
    true
  );
  assert.deepEqual(
    UtilityProviderBillService
      .getActiveProviderBills()
      .map(
        (providerBill) =>
          providerBill.id
      ),
    []
  );
  assert.deepEqual(
    UtilityProviderBillService
      .getPaidProviderBills()
      .map(
        (providerBill) => [
          providerBill.id,
          providerBill.status,
          providerBill.transactionId,
        ]
      ),
    [
      [
        "paid-loop-water-bill",
        "paid",
        transactionId,
      ],
    ]
  );
});

test("deleting an unpaid provider bill removes it from reloadable bills", async () => {
  const { localStorage } =
    installBrowserStorage();
  const householdId =
    "household-delete-unpaid-provider-bill";

  localStorage.setItem(
    HFOS_STORAGE_KEYS.household,
    JSON.stringify(
      createStorageEnvelope({
        id:
          householdId,
        householdName:
          "Delete Unpaid Provider Bill",
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
        "delete-unpaid-water-bill",
      householdId,
      providerName:
        "Manila Water",
      utilityType:
        "water",
      unit:
        "m3",
      status:
        "unpaid",
      paidAt:
        null,
    })
  );

  const result =
    await UtilityProviderBillService
      .deleteUnpaid(
        "delete-unpaid-water-bill"
      );

  assert.equal(
    result.success,
    true
  );
  assert.deepEqual(
    UtilityProviderBillService
      .getActiveProviderBills()
      .map(
        (providerBill) =>
          providerBill.id
      ),
    []
  );
});

test("repairing a paid provider bill restores the paid-by member from the linked transaction", async () => {
  const { localStorage } =
    installBrowserStorage();
  const householdId =
    "household-repair-provider-bill-payer";
  const transactionId =
    "paid-provider-payment-transaction";

  localStorage.setItem(
    HFOS_STORAGE_KEYS.household,
    JSON.stringify(
      createStorageEnvelope({
        id:
          householdId,
        householdName:
          "Repair Provider Bill Payer",
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

  TransactionRepository.replaceForHousehold(
    householdId,
    [
      createTransaction({
        id:
          transactionId,
        householdId,
        paidByMemberId:
          "member-dadi",
        amount:
          1409.2,
        category:
          "Water",
        description:
          "Water utility bill",
        transactionDate:
          new Date(
            "2026-07-13T00:00:00"
          ),
      }),
    ]
  );

  UtilityProviderBillRepository.create(
    createProviderBill({
      id:
        "repair-paid-water-bill",
      householdId,
      providerName:
        "Manila Water",
      utilityType:
        "water",
      unit:
        "m3",
      status:
        "paid",
      paidByMemberId:
        "",
      paidAt:
        new Date(
          "2026-07-13T00:00:00"
        ),
      transactionId,
    })
  );

  const result =
    await UtilityProviderBillService
      .repairPaidByMember(
        "repair-paid-water-bill",
        "member-rasha"
      );

  assert.equal(
    result.success,
    true
  );
  assert.equal(
    UtilityProviderBillService
      .getPaidProviderBills()
      .find(
        (providerBill) =>
          providerBill.id ===
          "repair-paid-water-bill"
      )?.paidByMemberId,
    "member-dadi"
  );
});

test("transaction delete preparation detaches linked provider bills", () => {
  const { localStorage } =
    installBrowserStorage();
  const householdId =
    "household-delete-linked-provider-bill";
  const transactionId =
    "water-payment-transaction";

  localStorage.setItem(
    HFOS_STORAGE_KEYS.household,
    JSON.stringify(
      createStorageEnvelope({
        id:
          householdId,
        householdName:
          "Delete Linked Provider Bill",
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

  TransactionRepository.replaceForHousehold(
    householdId,
    [
      createTransaction({
        id:
          transactionId,
        householdId,
      }),
    ]
  );

  UtilityProviderBillRepository.create(
    createProviderBill({
      id:
        "water-provider-bill",
      householdId,
      utilityType:
        "water",
      unit:
        "m3",
      providerName:
        "Maynilad",
      status:
        "paid",
      paidByMemberId:
        "member-1",
      sourceAccountId:
        "cash",
      paidAt:
        new Date(
          "2026-07-13T00:00:00"
        ),
      paymentReferenceNumber:
        "WATER-PAID",
      transactionId,
    })
  );

  const detachResult =
    TransactionService
      .detachUtilityProviderBillsForTransaction(
        transactionId
      );

  assert.equal(
    detachResult.success,
    true
  );
  assert.equal(
    detachResult.data?.length,
    1
  );

  const detachedProviderBill =
    UtilityProviderBillRepository.findById(
      "water-provider-bill"
    );

  assert.equal(
    detachedProviderBill?.status,
    "unpaid"
  );
  assert.equal(
    detachedProviderBill?.transactionId,
    ""
  );
  assert.equal(
    detachedProviderBill?.paidAt,
    null
  );

  const restoreResult =
    TransactionService.restoreUtilityProviderBills(
      detachResult.data ?? []
    );

  assert.equal(
    restoreResult.success,
    true
  );

  const restoredProviderBill =
    UtilityProviderBillRepository.findById(
      "water-provider-bill"
    );

  assert.equal(
    restoredProviderBill?.status,
    "paid"
  );
  assert.equal(
    restoredProviderBill?.transactionId,
    transactionId
  );
});

test("transaction delete preparation relinks provider bill to paid duplicate", () => {
  const { localStorage } =
    installBrowserStorage();
  const householdId =
    "household-delete-relink-provider-bill";
  const staleTransactionId =
    "stale-water-payment-transaction";
  const paidTransactionId =
    "paid-water-payment-transaction";
  const now =
    new Date(
      "2026-07-13T00:00:00"
    );

  localStorage.setItem(
    HFOS_STORAGE_KEYS.household,
    JSON.stringify(
      createStorageEnvelope({
        id:
          householdId,
        householdName:
          "Relink Provider Bill",
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

  TransactionRepository.replaceForHousehold(
    householdId,
    [
      createTransaction({
        id:
          staleTransactionId,
        householdId,
        amount:
          1409.2,
      }),
      createTransaction({
        id:
          paidTransactionId,
        householdId,
        amount:
          1409.2,
        sourceAccountId:
          "cash",
      }),
    ]
  );
  ExpenseAllocationRepository.createMany([
    {
      id:
        "paid-water-allocation",
      transactionId:
        paidTransactionId,
      paidByMemberId:
        "member-owner",
      memberId:
        "member-rasha",
      isIncluded:
        true,
      allocatedAmount:
        1409.2,
      personalAmount:
        0,
      personalItems: [],
      notes:
        "",
      createdAt:
        now,
      updatedAt:
        now,
    },
  ]);
  SettlementRepository.create({
    id:
      "water-settlement",
    householdId,
    fromMemberId:
      "member-rasha",
    toMemberId:
      "member-owner",
    amount:
      1409.2,
    settlementDate:
      now,
    sourceAccountId:
      "cash",
    destinationAccountId:
      "",
    applicationMethod:
      "manual",
    referenceNumber:
      "WATER-SETTLED",
    notes:
      "",
    attachments: [],
    isActive:
      true,
    createdAt:
      now,
    updatedAt:
      now,
  });
  SettlementApplicationRepository.createMany([
    {
      id:
        "water-settlement-application",
      settlementId:
        "water-settlement",
      expenseAllocationId:
        "paid-water-allocation",
      appliedAmount:
        1409.2,
      createdAt:
        now,
      updatedAt:
        now,
    },
  ]);

  UtilityProviderBillRepository.create(
    createProviderBill({
      id:
        "water-provider-bill-relink",
      householdId,
      utilityType:
        "water",
      unit:
        "m3",
      providerName:
        "Maynilad",
      status:
        "paid",
      paidByMemberId:
        "member-owner",
      sourceAccountId:
        "cash",
      paidAt:
        now,
      paymentReferenceNumber:
        "OLD-LINK",
      transactionId:
        staleTransactionId,
    })
  );

  const detachResult =
    TransactionService
      .detachUtilityProviderBillsForTransaction(
        staleTransactionId
      );

  assert.equal(
    detachResult.success,
    true
  );

  const providerBill =
    UtilityProviderBillRepository.findById(
      "water-provider-bill-relink"
    );

  assert.equal(
    providerBill?.status,
    "paid"
  );
  assert.equal(
    providerBill?.transactionId,
    paidTransactionId
  );
  assert.equal(
    providerBill?.sourceAccountId,
    "cash"
  );
});

test("transaction date edits move linked paid provider bills to the corrected payment month", () => {
  const { localStorage } =
    installBrowserStorage();
  const householdId =
    "household-edit-linked-provider-bill-date";
  const transactionId =
    "linked-electric-payment-transaction";

  localStorage.setItem(
    HFOS_STORAGE_KEYS.household,
    JSON.stringify(
      createStorageEnvelope({
        id:
          householdId,
        householdName:
          "Edit Linked Provider Bill Date",
        country:
          "PH",
        currency:
          "PHP",
        timezone:
          "Asia/Manila",
        members: [
          {
            id:
              "member-1",
            householdId,
            displayName:
              "Dadi Buboy",
            role:
              "owner",
            isActive:
              true,
            createdAt:
              "2026-08-01T00:00:00.000Z",
            updatedAt:
              "2026-08-01T00:00:00.000Z",
          },
        ],
        createdAt:
          "2026-08-01T00:00:00.000Z",
        updatedAt:
          "2026-08-01T00:00:00.000Z",
      })
    )
  );

  TransactionRepository.replaceForHousehold(
    householdId,
    [
      createTransaction({
        id:
          transactionId,
        householdId,
        category:
          "Electricity",
        description:
          "Meralco utility bill",
        transactionDate:
          new Date(
            "2026-08-28T00:00:00"
          ),
        exchangeRateEffectiveDate:
          new Date(
            "2026-08-28T00:00:00"
          ),
      }),
    ]
  );

  UtilityProviderBillRepository.create(
    createProviderBill({
      id:
        "meralco-provider-bill",
      householdId,
      utilityType:
        "electricity",
      unit:
        "kWh",
      providerName:
        "Meralco",
      status:
        "paid",
      paidByMemberId:
        "member-1",
      sourceAccountId:
        "",
      paidAt:
        new Date(
          "2026-08-28T00:00:00"
        ),
      transactionId,
    })
  );

  const result =
    TransactionService.update(
      transactionId,
      {
        type: "expense",
        amount: 1000,
        enteredAmount: 1000,
        enteredCurrency: "PHP",
        baseAmount: 1000,
        exchangeRate: 1,
        exchangeRateEffectiveDate:
          "2026-09-02",
        exchangeRateSource: "manual",
        exchangeRateProvider: "",
        paidByMemberId: "member-1",
        visibility: "household",
        sourceAccountId: "",
        destinationAccountId: "",
        category: "Electricity",
        description:
          "Meralco utility bill",
        notes: "",
        transactionDate:
          "2026-09-02",
        splitMethod: "none",
        allocations: [],
        attachments: [],
        isActive: true,
      }
    );

  assert.equal(
    result.success,
    true
  );

  const updatedTransaction =
    TransactionRepository.findById(
      transactionId
    );
  const updatedProviderBill =
    UtilityProviderBillRepository.findById(
      "meralco-provider-bill"
    );

  assert.equal(
    updatedTransaction
      ?.transactionDate
      ? formatLocalDateKey(
          updatedTransaction
            .transactionDate
        )
      : "",
    "2026-09-02"
  );
  assert.equal(
    updatedProviderBill
      ?.paidAt
      ? formatLocalDateKey(
          updatedProviderBill
            .paidAt
        )
      : "",
    "2026-09-02"
  );

  assert.equal(
    getProviderBillsPaidInMonth(
      updatedProviderBill
        ? [updatedProviderBill]
        : [],
      new Date(
        "2026-08-01T00:00:00"
      )
    ).length,
    0
  );
  assert.deepEqual(
    getProviderBillsPaidInMonth(
      updatedProviderBill
        ? [updatedProviderBill]
        : [],
      new Date(
        "2026-09-01T00:00:00"
      )
    ).map(
      (providerBill) =>
        providerBill.id
    ),
    [
      "meralco-provider-bill",
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
