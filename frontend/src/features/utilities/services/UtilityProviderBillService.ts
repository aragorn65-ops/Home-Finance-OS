import {
  loadHousehold,
} from "../../household/services/householdStorage";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types/index";

import type {
  StoredAttachment,
} from "../../../shared/models/StoredAttachment";
import createAttachmentMetadataRecords from "../../../shared/utils/createAttachmentMetadataRecords";

import type {
  UtilityBillForm,
} from "../models/UtilityBillForm";

import UtilityBillPersistenceService from "./UtilityBillPersistenceService";

import type {
  UtilityBillShareResult,
} from "../models/UtilityBillShareResult";

import type {
  UtilityProviderBill,
} from "../models/UtilityProviderBill";

import UtilityProviderBillRepository from "../repositories/UtilityProviderBillRepository";

export interface UtilityProviderBillDuplicateMatch {
  providerBill: UtilityProviderBill;
  reasons: string[];
}

export default class UtilityProviderBillService {
  static getActiveProviderBills():
    UtilityProviderBill[] {
    const household =
      loadHousehold();

    if (!household) {
      return [];
    }

    return UtilityProviderBillRepository
      .findActiveByHouseholdId(
        household.id
      )
      .filter(
        (providerBill) =>
          providerBill.status === "unpaid"
      )
      .sort(
        (left, right) =>
          left.dueDate.getTime() -
          right.dueDate.getTime()
      );
  }

  static getPaidProviderBills():
    UtilityProviderBill[] {
    const household =
      loadHousehold();

    if (!household) {
      return [];
    }

    return UtilityProviderBillRepository
      .findActiveByHouseholdId(
        household.id
      )
      .filter(
        (providerBill) =>
          providerBill.status === "paid"
      )
      .sort(
        (left, right) =>
          (right.paidAt?.getTime() ?? 0) -
          (left.paidAt?.getTime() ?? 0)
      );
  }

  static findPotentialDuplicates(
    form: UtilityBillForm
  ): UtilityProviderBillDuplicateMatch[] {
    const household =
      loadHousehold();

    if (!household) {
      return [];
    }

    const normalizedProvider =
      normalizeProviderName(
        form.providerName
      );
    const billingMonth =
      getMonthKey(form.billingDate);
    const amountCents =
      toCents(form.totalBillAmount);

    if (
      !billingMonth ||
      amountCents <= 0
    ) {
      return [];
    }

    return UtilityProviderBillRepository
      .findActiveByHouseholdId(
        household.id
      )
      .map((providerBill) => {
        const reasons: string[] =
          [];
        const sameProvider =
          normalizedProvider.length >
            0 &&
          normalizeProviderName(
            providerBill.providerName
          ) === normalizedProvider;
        const sameFallbackProvider =
          normalizedProvider.length ===
            0 &&
          providerBill.utilityType ===
            form.utilityType;
        const sameAmount =
          toCents(
            providerBill.totalBillAmount
          ) === amountCents;
        const sameBillingMonth =
          getMonthKey(
            providerBill.billingDate
          ) === billingMonth;

        if (
          providerBill.utilityType ===
          form.utilityType
        ) {
          reasons.push(
            "same utility type"
          );
        }

        if (
          sameProvider ||
          sameFallbackProvider
        ) {
          reasons.push(
            "same provider"
          );
        }

        if (sameBillingMonth) {
          reasons.push(
            "same billing month"
          );
        }

        if (sameAmount) {
          reasons.push(
            "same bill amount"
          );
        }

        const isDuplicate =
          (
            sameProvider ||
            sameFallbackProvider
          ) &&
          sameBillingMonth &&
          sameAmount;

        return isDuplicate
          ? {
              providerBill,
              reasons,
            }
          : undefined;
      })
      .filter(
        (
          match
        ): match is UtilityProviderBillDuplicateMatch =>
          match !== undefined
      );
  }

  static createUnpaid(
    form: UtilityBillForm,
    calculation: UtilityBillShareResult
  ): OperationResult<UtilityProviderBill> {
    const household =
      loadHousehold();

    if (!household) {
      return OperationResults.failure<
        UtilityProviderBill
      >(
        {
          household:
            "Complete household setup before saving a provider bill.",
        },
        "Unable to save the provider bill."
      );
    }

    if (!calculation.isBalanced) {
      return OperationResults.failure<
        UtilityProviderBill
      >(
        {
          shares:
            "Member shares must equal the total provider bill before saving.",
        },
        "Unable to save an unbalanced provider bill."
      );
    }

    const savedAt =
      new Date();

    const providerBill:
      UtilityProviderBill = {
      id:
        createProviderBillId(),
      householdId:
        household.id,

      utilityType:
        form.utilityType,
      unit:
        form.unit,

      providerName:
        form.providerName.trim(),
      billingDate:
        parseDateInput(
          form.billingDate
        ),
      dueDate:
        parseDateInput(
          form.dueDate
        ),

      totalBillAmount:
        calculation.totalBillAmount,
      ratePerUnit:
        calculation.ratePerUnit,

      status: "unpaid",

      formSnapshot:
        buildFormSnapshot(form),
      calculationSnapshot:
        cloneCalculation(
          calculation
        ),
      memberShareSnapshot:
        calculation.memberShares.map(
          (memberShare) => ({
            ...memberShare,
          })
        ),

      billAttachments:
        createAttachmentMetadataRecords(
          form.attachments
        ),
      paymentAttachments: [],

      paidByMemberId: "",
      sourceAccountId: "",
      paidAt: null,
      paymentReferenceNumber: "",
      transactionId: "",

      visibility:
        form.visibility,
      description:
        form.description.trim(),
      notes:
        form.notes.trim(),

      isActive:
        form.isActive,
      createdAt:
        savedAt,
      updatedAt:
        savedAt,
    };

    const savedProviderBill =
      UtilityProviderBillRepository.create(
        providerBill
      );

    return OperationResults.success(
      savedProviderBill,
      "Provider bill saved as unpaid. Member shares are ready, and no payment transaction was created yet."
    );
  }

  static async markPaid(
    providerBillId: string,
    payment: {
      paidByMemberId: string;
      sourceAccountId: string;
      paidAt: string;
      referenceNumber: string;
      paymentAttachments: StoredAttachment[];
    }
  ): Promise<OperationResult<UtilityProviderBill>> {
    const providerBill =
      UtilityProviderBillRepository.findById(
        providerBillId
      );

    if (!providerBill) {
      return OperationResults.failure<
        UtilityProviderBill
      >(
        {
          providerBill:
            "Select a valid provider bill.",
        },
        "Provider bill was not found."
      );
    }

    if (providerBill.status === "paid") {
      return OperationResults.failure<
        UtilityProviderBill
      >(
        {
          providerBill:
            "This provider bill is already marked paid.",
        },
        "Provider bill is already paid."
      );
    }

    if (!payment.paidByMemberId.trim()) {
      return OperationResults.failure<
        UtilityProviderBill
      >(
        {
          paidByMemberId:
            "Select the household member who paid the provider.",
        },
        "Unable to mark the provider bill paid."
      );
    }

    if (!isValidDate(payment.paidAt)) {
      return OperationResults.failure<
        UtilityProviderBill
      >(
        {
          paidAt:
            "Enter a valid provider payment date.",
        },
        "Unable to mark the provider bill paid."
      );
    }

    const transactionForm =
      buildPaidUtilityForm(
        providerBill,
        payment
      );

    const saveResult =
      await UtilityBillPersistenceService.save(
        transactionForm,
        providerBill.calculationSnapshot
      );

    if (!saveResult.success) {
      return OperationResults.failure<
        UtilityProviderBill
      >(
        saveResult.errors,
        saveResult.message ??
          "Unable to create the provider payment transaction."
      );
    }

    const updatedProviderBill:
      UtilityProviderBill = {
      ...providerBill,
      status: "paid",
      paidByMemberId:
        payment.paidByMemberId.trim(),
      sourceAccountId:
        payment.sourceAccountId.trim(),
      paidAt:
        parseDateInput(
          payment.paidAt
        ),
      paymentReferenceNumber:
        payment.referenceNumber.trim(),
      paymentAttachments:
        createAttachmentMetadataRecords(
          payment.paymentAttachments
        ),
      transactionId:
        saveResult.data?.id ?? "",
      updatedAt:
        new Date(),
    };

    const savedProviderBill =
      UtilityProviderBillRepository.update(
        updatedProviderBill
      );

    return OperationResults.success(
      savedProviderBill,
      "Provider bill marked paid. HFOS created the transaction and settlement obligations."
    );
  }

  static replaceBillAttachments(
    providerBillId: string,
    billAttachments:
      StoredAttachment[]
  ): OperationResult<UtilityProviderBill> {
    const providerBill =
      UtilityProviderBillRepository.findById(
        providerBillId
      );

    if (!providerBill) {
      return OperationResults.failure<
        UtilityProviderBill
      >(
        {
          providerBill:
            "Select a valid provider bill.",
        },
        "Provider bill was not found."
      );
    }

    if (providerBill.status !== "unpaid") {
      return OperationResults.failure<
        UtilityProviderBill
      >(
        {
          providerBill:
            "Paid provider bills cannot be changed from Bills to Pay.",
        },
        "Provider bill attachment was not updated."
      );
    }

    const updatedProviderBill:
      UtilityProviderBill = {
      ...providerBill,
      billAttachments:
        createAttachmentMetadataRecords(
          billAttachments
        ),
      updatedAt:
        new Date(),
    };

    const savedProviderBill =
      UtilityProviderBillRepository.update(
        updatedProviderBill
      );

    return OperationResults.success(
      savedProviderBill,
      "Provider bill attachment updated."
    );
  }

  static deleteUnpaid(
    providerBillId: string
  ): OperationResult<UtilityProviderBill> {
    const providerBill =
      UtilityProviderBillRepository.findById(
        providerBillId
      );

    if (!providerBill) {
      return OperationResults.failure<
        UtilityProviderBill
      >(
        {
          providerBill:
            "Select a valid provider bill.",
        },
        "Provider bill was not found."
      );
    }

    if (providerBill.status !== "unpaid") {
      return OperationResults.failure<
        UtilityProviderBill
      >(
        {
          providerBill:
            "Paid provider bills cannot be deleted from Bills to Pay.",
        },
        "Provider bill was not deleted."
      );
    }

    const updatedProviderBill:
      UtilityProviderBill = {
      ...providerBill,
      isActive: false,
      updatedAt:
        new Date(),
    };

    const savedProviderBill =
      UtilityProviderBillRepository.update(
        updatedProviderBill
      );

    return OperationResults.success(
      savedProviderBill,
      "Unpaid provider bill deleted."
    );
  }
}

function buildFormSnapshot(
  form: UtilityBillForm
): UtilityProviderBill["formSnapshot"] {
  return {
    utilityType:
      form.utilityType,
    unit:
      form.unit,

    providerName:
      form.providerName.trim(),
    billingDate:
      form.billingDate,
    dueDate:
      form.dueDate,

    totalBillAmount:
      form.totalBillAmount,
    ratePerUnit:
      form.ratePerUnit,
    totalConsumption:
      form.totalConsumption,

    memberShares:
      form.memberShares.map(
        (memberShare) => ({
          ...memberShare,
        })
      ),
    applianceUsages:
      form.applianceUsages.map(
        (usage) => ({
          ...usage,
        })
      ),

    visibility:
      form.visibility,
    description:
      form.description.trim(),
    notes:
      form.notes.trim(),
  };
}

function buildPaidUtilityForm(
  providerBill: UtilityProviderBill,
  payment: {
    paidByMemberId: string;
    sourceAccountId: string;
    paidAt: string;
    referenceNumber: string;
    paymentAttachments: StoredAttachment[];
  }
): UtilityBillForm {
  const paymentNote =
    payment.referenceNumber.trim()
      ? `Payment reference: ${payment.referenceNumber.trim()}`
      : "";

  return {
    utilityType:
      providerBill.formSnapshot.utilityType,
    unit:
      providerBill.formSnapshot.unit,

    providerName:
      providerBill.formSnapshot.providerName,
    billingDate:
      providerBill.formSnapshot.billingDate,
    dueDate:
      providerBill.formSnapshot.dueDate,

    totalBillAmount:
      providerBill.formSnapshot.totalBillAmount,
    ratePerUnit:
      providerBill.formSnapshot.ratePerUnit,
    totalConsumption:
      providerBill.formSnapshot.totalConsumption,

    memberShares:
      providerBill.formSnapshot.memberShares.map(
        (memberShare) => ({
          ...memberShare,
        })
      ),
    applianceUsages:
      providerBill.formSnapshot.applianceUsages.map(
        (usage) => ({
          ...usage,
        })
      ),

    paidByMemberId:
      payment.paidByMemberId.trim(),
    sourceAccountId:
      payment.sourceAccountId.trim(),

    visibility:
      providerBill.formSnapshot.visibility,
    description:
      providerBill.formSnapshot.description,
    notes: [
      providerBill.formSnapshot.notes,
      paymentNote,
    ]
      .filter(Boolean)
      .join("\n"),

    attachments: [
      ...providerBill.billAttachments,
      ...payment.paymentAttachments,
    ].map((attachment) => ({
      ...attachment,
      createdAt:
        new Date(
          attachment.createdAt
        ),
    })),

    transactionDate:
      payment.paidAt,
    isActive:
      providerBill.isActive,
  };
}

function cloneCalculation(
  calculation: UtilityBillShareResult
): UtilityBillShareResult {
  return {
    ...calculation,
    memberShares:
      calculation.memberShares.map(
        (memberShare) => ({
          ...memberShare,
        })
      ),
  };
}

function parseDateInput(
  value: string
): Date {
  const date =
    new Date(`${value}T00:00:00`);

  return Number.isNaN(
    date.getTime()
  )
    ? new Date()
    : date;
}

function normalizeProviderName(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getMonthKey(
  value: string | Date
): string {
  const date =
    value instanceof Date
      ? value
      : parseDateInput(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function toCents(
  amount: number
): number {
  return Math.round(
    amount * 100
  );
}

function isValidDate(
  value: string
): boolean {
  return (
    Boolean(value) &&
    !Number.isNaN(
      new Date(value).getTime()
    )
  );
}

function createProviderBillId():
  string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
  ) {
    return crypto.randomUUID();
  }

  return `provider-bill-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}
