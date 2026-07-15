import type {
  UtilityApplianceUsageForm,
  UtilityBillForm,
  UtilityMemberShareForm,
} from "../models/UtilityBillForm";

export interface UtilityBillValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export default class UtilityBillValidator {
  /**
   * Validates one utility bill form.
   */
  static validate(
    form: UtilityBillForm
  ): UtilityBillValidationResult {
    const errors: Record<string, string> = {};

    this.validateBillDetails(
      form,
      errors
    );

    this.validateDates(
      form,
      errors
    );

    this.validateMemberShares(
      form,
      errors
    );

    this.validateApplianceUsages(
      form,
      errors
    );

    this.validateDirectUsageAmount(
      form,
      errors
    );

    this.validateTransactionDetails(
      form,
      errors
    );

    return {
      isValid:
        Object.keys(errors).length === 0,

      errors,
    };
  }

  /**
   * Validates values copied from the provider bill.
   */
  private static validateBillDetails(
    form: UtilityBillForm,
    errors: Record<string, string>
  ): void {
    if (
      form.utilityType === "electricity" &&
      form.unit !== "kWh"
    ) {
      errors.unit =
        "Electricity usage must use kWh.";
    }

    if (
      form.utilityType === "water" &&
      form.unit !== "m3"
    ) {
      errors.unit =
        "Water usage must use m3.";
    }

    if (
      !Number.isFinite(
        form.totalBillAmount
      ) ||
      form.totalBillAmount <= 0
    ) {
      errors.totalBillAmount =
        "Total bill amount must be greater than zero.";
    }

    if (
      !Number.isFinite(
        form.ratePerUnit
      ) ||
      form.ratePerUnit <= 0
    ) {
      errors.ratePerUnit =
        "Rate per unit must be greater than zero.";
    }
  }

  /**
   * Validates billing and transaction dates.
   */
  private static validateDates(
    form: UtilityBillForm,
    errors: Record<string, string>
  ): void {
    if (
      !form.billingDate ||
      !this.isValidDate(
        form.billingDate
      )
    ) {
      errors.billingDate =
        "Enter a valid billing date.";
    }

    if (
      !form.transactionDate ||
      !this.isValidDate(
        form.transactionDate
      )
    ) {
      errors.transactionDate =
        "Enter a valid transaction date.";
    }
  }

  /**
   * Validates member submeter, compensation, and shared
   * remainder participation.
   */
  private static validateMemberShares(
    form: UtilityBillForm,
    errors: Record<string, string>
  ): void {
    if (
      form.memberShares.length === 0
    ) {
      errors.memberShares =
        "Add at least one household member.";

      return;
    }

    const memberIds =
      new Set<string>();

    const meterIds =
      new Set<string>();

    for (
      const memberShare of
      form.memberShares
    ) {
      const validationError =
        this.validateMemberShare(
          memberShare,
          memberIds,
          meterIds
        );

      if (validationError) {
        errors.memberShares =
          validationError;

        return;
      }
    }

    const hasSharedMember =
      form.memberShares.some(
        (memberShare) =>
          memberShare.sharesRemainder
      );

    if (!hasSharedMember) {
      errors.memberShares =
        "At least one household member must share the remaining bill.";
    }
  }

  /**
   * Validates one member-share entry.
   */
  private static validateMemberShare(
    memberShare: UtilityMemberShareForm,
    memberIds: Set<string>,
    meterIds: Set<string>
  ): string | undefined {
    const memberId =
      memberShare.memberId.trim();

    if (!memberId) {
      return "Every utility share must reference a household member.";
    }

    if (
      memberIds.has(memberId)
    ) {
      return "A household member cannot appear more than once.";
    }

    memberIds.add(memberId);

    const utilityMeterId =
      memberShare.utilityMeterId.trim();

    if (utilityMeterId) {
      if (
        meterIds.has(
          utilityMeterId
        )
      ) {
        return "A saved submeter cannot be assigned to more than one member.";
      }

      meterIds.add(
        utilityMeterId
      );
    }

    if (
      !Number.isFinite(
        memberShare.previousReading
      ) ||
      memberShare.previousReading < 0
    ) {
      return "Previous submeter readings must be valid non-negative numbers.";
    }

    if (
      !Number.isFinite(
        memberShare.currentReading
      ) ||
      memberShare.currentReading < 0
    ) {
      return "Current submeter readings must be valid non-negative numbers.";
    }

    if (
      !memberShare.isMeterReset &&
      memberShare.currentReading <
        memberShare.previousReading
    ) {
      return "A current submeter reading cannot be lower than its previous reading unless the meter was reset.";
    }

    if (
      !memberShare.isMeterReset &&
      memberShare.resetUsageQuantity !== 0
    ) {
      return "Reset usage must be zero when the submeter was not reset.";
    }

    if (
      memberShare.isMeterReset &&
      !memberShare.meterResetReason.trim()
    ) {
      return "A reset submeter must include a reason.";
    }

    if (
      memberShare.isMeterReset &&
      (
        !Number.isFinite(
          memberShare.resetUsageQuantity
        ) ||
        memberShare.resetUsageQuantity < 0
      )
    ) {
      return "A reset submeter must include valid non-negative usage.";
    }

    if (
      !Number.isFinite(
        memberShare.fixedCompensationAmount
      ) ||
      memberShare.fixedCompensationAmount < 0
    ) {
      return "Fixed compensation must be a valid non-negative amount.";
    }

    if (
      typeof memberShare.sharesRemainder !==
      "boolean"
    ) {
      return "Every member must specify whether they share the remaining bill.";
    }

    return undefined;
  }

  /**
   * Validates personal appliance usage.
   */
  private static validateApplianceUsages(
    form: UtilityBillForm,
    errors: Record<string, string>
  ): void {
    if (
      form.utilityType === "water" &&
      form.applianceUsages.length > 0
    ) {
      errors.applianceUsages =
        "Appliance usage is supported only for electricity.";

      return;
    }

    const memberIds =
      new Set(
        form.memberShares.map(
          (memberShare) =>
            memberShare.memberId.trim()
        )
      );

    for (
      const usage of
      form.applianceUsages
    ) {
      const validationError =
        this.validateApplianceUsage(
          usage,
          memberIds
        );

      if (validationError) {
        errors.applianceUsages =
          validationError;

        return;
      }
    }
  }

  /**
   * Validates one appliance usage entry.
   */
  private static validateApplianceUsage(
    usage: UtilityApplianceUsageForm,
    memberIds: Set<string>
  ): string | undefined {
    const memberId =
      usage.memberId.trim();

    if (!memberId) {
      return "Every appliance entry must reference a household member.";
    }

    if (
      !memberIds.has(memberId)
    ) {
      return "Every appliance entry must reference a member included in the bill.";
    }

    if (!usage.applianceName.trim()) {
      return "Every appliance entry must include an appliance name.";
    }

    if (
      !Number.isFinite(
        usage.powerKilowatts
      ) ||
      usage.powerKilowatts <= 0
    ) {
      return "Appliance power in kW must be greater than zero.";
    }

    if (
      !Number.isFinite(
        usage.usageHours
      ) ||
      usage.usageHours <= 0
    ) {
      return "Appliance usage hours must be greater than zero.";
    }

    return undefined;
  }

  /**
   * Ensures all direct member amounts remain within the
   * total amount payable to the provider.
   */
  private static validateDirectUsageAmount(
    form: UtilityBillForm,
    errors: Record<string, string>
  ): void {
    if (
      !Number.isFinite(
        form.totalBillAmount
      ) ||
      form.totalBillAmount <= 0 ||
      !Number.isFinite(
        form.ratePerUnit
      ) ||
      form.ratePerUnit <= 0
    ) {
      return;
    }

    const submeterUsage =
      form.memberShares.reduce(
        (total, memberShare) =>
          total +
          this.getSubmeterConsumption(
            memberShare
          ),
        0
      );

    const applianceUsage =
      form.applianceUsages.reduce(
        (total, usage) =>
          total +
          usage.powerKilowatts *
            usage.usageHours,
        0
      );

    const totalFixedCompensation =
      form.memberShares.reduce(
        (total, memberShare) =>
          total +
          memberShare.fixedCompensationAmount,
        0
      );

    const totalDirectUsageAmount =
      (
        submeterUsage +
        applianceUsage
      ) *
        form.ratePerUnit +
      totalFixedCompensation;

    if (
      totalDirectUsageAmount >
      form.totalBillAmount + 0.005
    ) {
      errors.shares =
        "Submeter charges, appliance charges, and fixed compensation cannot exceed the total utility bill.";
    }
  }

  /**
   * Validates transaction-level inputs.
   */
  private static validateTransactionDetails(
    form: UtilityBillForm,
    errors: Record<string, string>
  ): void {
    if (!form.paidByMemberId.trim()) {
      errors.paidByMemberId =
        "Select the household member who paid the utility bill.";
    }

    const memberIds =
      new Set(
        form.memberShares.map(
          (memberShare) =>
            memberShare.memberId.trim()
        )
      );

    if (
      form.paidByMemberId.trim() &&
      !memberIds.has(
        form.paidByMemberId.trim()
      )
    ) {
      errors.paidByMemberId =
        "The payer must be a household member included in the bill.";
    }

    if (
      ![
        "household",
        "participants",
        "private",
      ].includes(
        form.visibility
      )
    ) {
      errors.visibility =
        "Select a valid transaction visibility.";
    }
  }

  /**
   * Resolves one member's submeter consumption.
   */
  private static getSubmeterConsumption(
    memberShare: UtilityMemberShareForm
  ): number {
    if (
      memberShare.isMeterReset
    ) {
      return memberShare.resetUsageQuantity;
    }

    return (
      memberShare.currentReading -
      memberShare.previousReading
    );
  }

  /**
   * Validates an ISO date-only value.
   */
  private static isValidDate(
    value: string
  ): boolean {
    const date =
      new Date(
        `${value}T00:00:00`
      );

    return !Number.isNaN(
      date.getTime()
    );
  }
}