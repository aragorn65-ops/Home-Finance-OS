import type {
  Transaction,
} from "../../transactions/models/Transaction";

import type {
  TransactionForm,
} from "../../transactions/models/TransactionForm";

import type {
  ExpenseAllocationForm,
} from "../../transactions/models/ExpenseAllocationForm";

import TransactionService from "../../transactions/services/TransactionService";

import {
  loadHousehold,
} from "../../household/services/householdStorage";
import {
  isAuthFeatureEnabled,
} from "../../../config/auth";
import {
  getAuthBackendAdapter,
  saveLinkedRemoteCoreSnapshot,
} from "../../auth";
import {
  browserCoreSnapshotRecordSource,
} from "../../auth/services/browserCoreSnapshotRecordSource";

import { currencies } from "../../../shared/data/currencies";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types";

import type {
  UtilityBillForm,
} from "../models/UtilityBillForm";

import type {
  UtilityBillShareResult,
  UtilityMemberShareResult,
} from "../models/UtilityBillShareResult";

export default class UtilityBillPersistenceService {
  /**
   * Saves a calculated utility bill as an expense
   * transaction with exact member allocations.
   */
  static async save(
    form: UtilityBillForm,
    calculation: UtilityBillShareResult
  ): Promise<OperationResult<Transaction>> {
    const household =
      loadHousehold();

    if (!household) {
      return OperationResults.failure<
        Transaction
      >(
        {
          household:
            "Complete household setup before saving a utility bill.",
        },
        "Unable to save the utility bill."
      );
    }

    if (!calculation.isBalanced) {
      return OperationResults.failure<
        Transaction
      >(
        {
          shares:
            "Member shares must equal the total provider bill before saving.",
        },
        "Unable to save an unbalanced utility bill."
      );
    }

    const formAmountCents =
      this.toCents(
        form.totalBillAmount
      );

    const calculationAmountCents =
      this.toCents(
        calculation.totalBillAmount
      );

    if (
      formAmountCents !==
      calculationAmountCents
    ) {
      return OperationResults.failure<
        Transaction
      >(
        {
          calculation:
            "The bill details changed after the shares were calculated. Calculate the shares again.",
        },
        "Utility calculation is no longer current."
      );
    }

    const householdCurrency =
      this.resolveHouseholdCurrency(
        household.currency
      );

    const transactionForm =
      this.buildTransactionForm(
        form,
        calculation,
        householdCurrency
      );

    const result =
      TransactionService.create(
        transactionForm,
        household.id
      );

    if (!result.success) {
      return OperationResults.failure<
        Transaction
      >(
        result.errors,
        result.message ??
          "Unable to save the utility transaction."
      );
    }

    return this.persistLinkedCoreSnapshot(
      result
    );
  }

  private static async persistLinkedCoreSnapshot(
    result: OperationResult<Transaction>
  ): Promise<OperationResult<Transaction>> {
    try {
      await saveLinkedRemoteCoreSnapshot({
        authEnabled:
          isAuthFeatureEnabled(),
        household:
          loadHousehold(),
        adapter:
          getAuthBackendAdapter(),
        recordSource:
          browserCoreSnapshotRecordSource,
      });

      return OperationResults.success(
        result.data as Transaction,
        "Utility bill saved to Transactions and Settlements."
      );
    } catch (error) {
      return OperationResults.failure<
        Transaction
      >(
        {
          cloud:
            getErrorMessage(error),
        },
        "Cloud utility transaction snapshot was not saved."
      );
    }
  }

  /**
   * Converts the utility bill and its calculated member
   * shares into the existing transaction form contract.
   */
  private static buildTransactionForm(
    form: UtilityBillForm,
    calculation: UtilityBillShareResult,
    householdCurrency: string
  ): TransactionForm {
    const utilityLabel =
      form.utilityType ===
      "electricity"
        ? "Electricity"
        : form.utilityType ===
          "water"
          ? "Water"
          : "Internet";

    return {
      type: "expense",

      amount:
        calculation.totalBillAmount,

      enteredAmount:
        calculation.totalBillAmount,

      enteredCurrency:
        householdCurrency,

      baseAmount:
        calculation.totalBillAmount,

      exchangeRate: 1,

      exchangeRateEffectiveDate:
        form.transactionDate,

      exchangeRateSource:
        "manual",

      exchangeRateProvider: "",

      paidByMemberId:
        form.paidByMemberId.trim(),

      visibility:
        form.visibility,

      sourceAccountId:
        form.sourceAccountId.trim(),

      destinationAccountId: "",

      category:
        utilityLabel,

      description:
        form.description.trim() ||
        `${utilityLabel} utility bill`,

      notes:
        this.buildTransactionNotes(
          form,
          calculation
        ),

      transactionDate:
        form.transactionDate,

      splitMethod: "exact",

      allocations:
        calculation.memberShares.map(
          (memberShare) =>
            this.buildAllocation(
              memberShare,
              calculation
            )
        ),

      attachments:
        form.attachments.map(
          (attachment) => ({
            ...attachment,

            createdAt:
              new Date(
                attachment.createdAt
              ),
          })
        ),

      isActive:
        form.isActive,
    };
  }

  /**
   * Builds one exact transaction allocation from the
   * calculated utility member share.
   */
  private static buildAllocation(
    memberShare: UtilityMemberShareResult,
    calculation: UtilityBillShareResult
  ): ExpenseAllocationForm {
    return {
      memberId:
        memberShare.memberId,

      isIncluded: true,

      allocatedAmount:
        memberShare.finalShareAmount,

      personalAmount: 0,

      personalItems: [],

      notes:
        this.buildAllocationNotes(
          memberShare,
          calculation
        ),
    };
  }

  /**
   * Stores the utility calculation summary in the
   * transaction notes until a dedicated utility record
   * repository is introduced.
   */
  private static buildTransactionNotes(
    form: UtilityBillForm,
    calculation: UtilityBillShareResult
  ): string {
    const generatedNotes = [
      `Provider billing date: ${form.billingDate}`,
      ...(form.utilityType === "water"
        ? [
            `Provider consumption: ${this.formatQuantity(
              form.totalConsumption
            )} ${calculation.unit}`,
          ]
        : []),
      ...(form.utilityType !==
      "internet"
        ? [
            `Rate per ${calculation.unit}: ${this.formatAmount(
              calculation.ratePerUnit
            )}`,
          ]
        : [
            "Fixed provider bill: shared without meter readings.",
          ]),
      `Total direct usage: ${this.formatAmount(
        calculation.totalDirectUsageAmount
      )}`,
      `Shared remainder: ${this.formatAmount(
        calculation.sharedRemainderAmount
      )}`,
      `Equal-sharing members: ${calculation.equalShareMemberCount}`,
    ];

    const enteredNotes =
      form.notes.trim();

    if (enteredNotes) {
      generatedNotes.push(
        `Notes: ${enteredNotes}`
      );
    }

    return generatedNotes.join(
      "\n"
    );
  }

  /**
   * Stores the member's utility breakdown in the
   * allocation notes.
   */
  private static buildAllocationNotes(
    memberShare: UtilityMemberShareResult,
    calculation: UtilityBillShareResult
  ): string {
    return [
      `Submeter: ${this.formatQuantity(
        memberShare.submeterConsumption
      )} ${calculation.unit} = ${this.formatAmount(
        memberShare.submeterChargeAmount
      )}`,

      `Appliance: ${this.formatQuantity(
        memberShare.applianceConsumption
      )} ${calculation.unit} = ${this.formatAmount(
        memberShare.applianceChargeAmount
      )}`,

      `Fixed compensation: ${this.formatAmount(
        memberShare.fixedCompensationAmount
      )}`,

      `Direct usage amount: ${this.formatAmount(
        memberShare.directUsageAmount
      )}`,

      `Equal shared amount: ${this.formatAmount(
        memberShare.equalSharedAmount
      )}`,

      `Final utility share: ${this.formatAmount(
        memberShare.finalShareAmount
      )}`,
    ].join(
      "\n"
    );
  }

  private static toCents(
    amount: number
  ): number {
    return Math.round(
      amount * 100
    );
  }

  private static resolveHouseholdCurrency(
    currency: string
  ): string {
    const normalizedCurrency =
      currency.trim().toUpperCase();

    const validCurrencies =
      currencies
        .map(
          (option) =>
            option.value
        )
        .filter(Boolean);

    return validCurrencies.includes(
      normalizedCurrency
    )
      ? normalizedCurrency
      : "PHP";
  }

  private static formatAmount(
    amount: number
  ): string {
    return new Intl.NumberFormat(
      "en-PH",
      {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  }

  private static formatQuantity(
    quantity: number
  ): string {
    return new Intl.NumberFormat(
      "en-PH",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      }
    ).format(quantity);
  }
}

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Core utility snapshot could not be saved.";
}
