import {
  loadHousehold,
} from "../../household/services/householdStorage";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types";

import type {
  UtilityBillForm,
} from "../models/UtilityBillForm";

import type {
  UtilityBillShareResult,
} from "../models/UtilityBillShareResult";

import type {
  UtilityProviderBill,
} from "../models/UtilityProviderBill";

import UtilityProviderBillRepository from "../repositories/UtilityProviderBillRepository";

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
      .sort(
        (left, right) =>
          left.dueDate.getTime() -
          right.dueDate.getTime()
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
        form.attachments.map(
          (attachment) => ({
            ...attachment,
            createdAt:
              new Date(
                attachment.createdAt
              ),
          })
        ),
      paymentAttachments: [],

      paidByMemberId: "",
      sourceAccountId: "",
      paidAt: null,
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
