import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types";

import type {
  UtilityBillForm,
  UtilityMemberShareForm,
} from "../models/UtilityBillForm";

import type {
  UtilityBillShareResult,
  UtilityMemberShareResult,
} from "../models/UtilityBillShareResult";

import UtilityBillValidator from "../validators/UtilityBillValidator";

interface DirectChargeComponent {
  memberIndex: number;

  type:
    | "submeter"
    | "appliance";

  rawAmount: number;
}

export default class UtilityBillShareCalculator {
  /**
   * Calculates a complete utility bill-share preview.
   *
   * This method does not persist any records.
   */
  static calculate(
    form: UtilityBillForm
  ): OperationResult<UtilityBillShareResult> {
    const validation =
      UtilityBillValidator.validate(form);

    if (!validation.isValid) {
      return OperationResults.failure<
        UtilityBillShareResult
      >(
        validation.errors,
        "Please correct the utility bill errors."
      );
    }

    const memberCount =
      form.memberShares.length;

    const submeterConsumption =
      form.memberShares.map(
        (memberShare) =>
          this.getSubmeterConsumption(
            memberShare
          )
      );

    const applianceConsumption =
      this.getApplianceConsumptionByMember(
        form
      );

    const totalSubmeterConsumption =
      submeterConsumption.reduce(
        (total, quantity) =>
          total + quantity,
        0
      );

    const totalApplianceConsumption =
      applianceConsumption.reduce(
        (total, quantity) =>
          total + quantity,
        0
      );

    const directChargeComponents =
      this.buildDirectChargeComponents(
        submeterConsumption,
        applianceConsumption,
        form.ratePerUnit
      );

    const totalUsageChargeCents =
      this.toCents(
        directChargeComponents.reduce(
          (total, component) =>
            total +
            component.rawAmount,
          0
        )
      );

    const directComponentCents =
      this.allocateRawAmounts(
        directChargeComponents.map(
          (component) =>
            component.rawAmount
        ),
        totalUsageChargeCents
      );

    const submeterChargeCents =
      new Array<number>(
        memberCount
      ).fill(0);

    const applianceChargeCents =
      new Array<number>(
        memberCount
      ).fill(0);

    directChargeComponents.forEach(
      (
        component,
        componentIndex
      ) => {
        const amount =
          directComponentCents[
            componentIndex
          ] ?? 0;

        if (
          component.type ===
          "submeter"
        ) {
          submeterChargeCents[
            component.memberIndex
          ] += amount;

          return;
        }

        applianceChargeCents[
          component.memberIndex
        ] += amount;
      }
    );

    const fixedCompensationCents =
      form.memberShares.map(
        (memberShare) =>
          this.toCents(
            memberShare.fixedCompensationAmount
          )
      );

    const directUsageCents =
      form.memberShares.map(
        (_, index) =>
          submeterChargeCents[index] +
          applianceChargeCents[index] +
          fixedCompensationCents[index]
      );

    const totalSubmeterChargeCents =
      submeterChargeCents.reduce(
        (total, amount) =>
          total + amount,
        0
      );

    const totalApplianceChargeCents =
      applianceChargeCents.reduce(
        (total, amount) =>
          total + amount,
        0
      );

    const totalFixedCompensationCents =
      fixedCompensationCents.reduce(
        (total, amount) =>
          total + amount,
        0
      );

    const totalDirectUsageCents =
      directUsageCents.reduce(
        (total, amount) =>
          total + amount,
        0
      );

    const totalBillCents =
      this.toCents(
        form.totalBillAmount
      );

    const sharedRemainderCents =
      totalBillCents -
      totalDirectUsageCents;

    if (
      sharedRemainderCents < 0
    ) {
      return OperationResults.failure<
        UtilityBillShareResult
      >(
        {
          shares:
            "Submeter charges, appliance charges, and fixed compensation exceed the total utility bill.",
        },
        "Direct member usage exceeds the provider bill."
      );
    }

    const equalShareEligibility =
      form.memberShares.map(
        (
          memberShare,
          index
        ) =>
          memberShare.sharesRemainder &&
          fixedCompensationCents[
            index
          ] === 0
      );

    const equalShareMemberIndexes =
      equalShareEligibility
        .map(
          (
            isEligible,
            index
          ) => ({
            isEligible,
            index,
          })
        )
        .filter(
          ({ isEligible }) =>
            isEligible
        )
        .map(
          ({ index }) =>
            index
        );

    if (
      sharedRemainderCents > 0 &&
      equalShareMemberIndexes.length === 0
    ) {
      return OperationResults.failure<
        UtilityBillShareResult
      >(
        {
          memberShares:
            "At least one household member must share the remaining bill.",
        },
        "The shared remainder cannot be distributed."
      );
    }

    const equalShareWeights =
      equalShareEligibility.map(
        (isEligible) =>
          isEligible
            ? 1
            : 0
      );

    const equalSharedCents =
      this.allocateByWeights(
        sharedRemainderCents,
        equalShareWeights
      );

    const finalShareCents =
      form.memberShares.map(
        (_, index) =>
          directUsageCents[index] +
          equalSharedCents[index]
      );

    const memberShares:
      UtilityMemberShareResult[] =
      form.memberShares.map(
        (memberShare, index) => ({
          memberId:
            memberShare.memberId.trim(),

          sharesRemainder:
            equalShareEligibility[
              index
            ],

          submeterConsumption:
            submeterConsumption[index],

          submeterChargeAmount:
            this.fromCents(
              submeterChargeCents[index]
            ),

          applianceConsumption:
            applianceConsumption[index],

          applianceChargeAmount:
            this.fromCents(
              applianceChargeCents[index]
            ),

          fixedCompensationAmount:
            this.fromCents(
              fixedCompensationCents[index]
            ),

          directUsageAmount:
            this.fromCents(
              directUsageCents[index]
            ),

          equalSharedAmount:
            this.fromCents(
              equalSharedCents[index]
            ),

          finalShareAmount:
            this.fromCents(
              finalShareCents[index]
            ),
        })
      );

    const totalMemberSharesCents =
      finalShareCents.reduce(
        (total, amount) =>
          total + amount,
        0
      );

    const validationDifferenceCents =
      totalBillCents -
      totalMemberSharesCents;

    const result:
      UtilityBillShareResult = {
        utilityType:
          form.utilityType,

        unit:
          form.unit,

        totalBillAmount:
          this.fromCents(
            totalBillCents
          ),

        ratePerUnit:
          form.ratePerUnit,

        totalSubmeterConsumption,

        totalApplianceConsumption,

        totalSubmeterChargeAmount:
          this.fromCents(
            totalSubmeterChargeCents
          ),

        totalApplianceChargeAmount:
          this.fromCents(
            totalApplianceChargeCents
          ),

        totalFixedCompensationAmount:
          this.fromCents(
            totalFixedCompensationCents
          ),

        totalDirectUsageAmount:
          this.fromCents(
            totalDirectUsageCents
          ),

        sharedRemainderAmount:
          this.fromCents(
            sharedRemainderCents
          ),

        equalShareMemberCount:
          equalShareMemberIndexes.length,

        equalShareAmountPerMember:
          equalShareMemberIndexes.length > 0
            ? this.fromCents(
                sharedRemainderCents
              ) /
              equalShareMemberIndexes.length
            : 0,

        memberShares,

        totalMemberShares:
          this.fromCents(
            totalMemberSharesCents
          ),

        validationDifference:
          this.fromCents(
            validationDifferenceCents
          ),

        isBalanced:
          validationDifferenceCents ===
          0,
      };

    if (!result.isBalanced) {
      return OperationResults.failure<
        UtilityBillShareResult
      >(
        {
          shares:
            "Member shares do not equal the total utility bill.",
        },
        "Unable to balance the utility bill."
      );
    }

    return OperationResults.success(
      result,
      "Utility bill shares calculated successfully."
    );
  }

  /**
   * Builds submeter and appliance charge components.
   */
  private static buildDirectChargeComponents(
    submeterConsumption: number[],
    applianceConsumption: number[],
    ratePerUnit: number
  ): DirectChargeComponent[] {
    const components:
      DirectChargeComponent[] = [];

    submeterConsumption.forEach(
      (
        quantity,
        memberIndex
      ) => {
        components.push({
          memberIndex,
          type: "submeter",

          rawAmount:
            quantity *
            ratePerUnit,
        });
      }
    );

    applianceConsumption.forEach(
      (
        quantity,
        memberIndex
      ) => {
        components.push({
          memberIndex,
          type: "appliance",

          rawAmount:
            quantity *
            ratePerUnit,
        });
      }
    );

    return components;
  }

  /**
   * Aggregates appliance consumption by member.
   *
   * Appliance consumption:
   * powerKilowatts × usageHours
   */
  private static getApplianceConsumptionByMember(
    form: UtilityBillForm
  ): number[] {
    const quantities =
      new Array<number>(
        form.memberShares.length
      ).fill(0);

    const memberIndexById =
      new Map(
        form.memberShares.map(
          (memberShare, index) => [
            memberShare.memberId.trim(),
            index,
          ])
      );

    for (
      const usage of
      form.applianceUsages
    ) {
      const memberIndex =
        memberIndexById.get(
          usage.memberId.trim()
        );

      if (
        memberIndex === undefined
      ) {
        continue;
      }

      quantities[memberIndex] +=
        usage.powerKilowatts *
        usage.usageHours;
    }

    return quantities;
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
   * Allocates an integer-cent total using equal,
   * non-negative weights.
   */
  private static allocateByWeights(
    totalCents: number,
    weights: number[]
  ): number[] {
    const safeWeights =
      weights.map(
        (weight) =>
          Number.isFinite(weight) &&
          weight > 0
            ? weight
            : 0
      );

    const weightTotal =
      safeWeights.reduce(
        (total, weight) =>
          total + weight,
        0
      );

    if (
      totalCents === 0 ||
      weightTotal === 0
    ) {
      return safeWeights.map(
        () => 0
      );
    }

    const rawAmounts =
      safeWeights.map(
        (weight) =>
          (
            totalCents /
            100
          ) *
          (
            weight /
            weightTotal
          )
      );

    return this.allocateRawAmounts(
      rawAmounts,
      totalCents
    );
  }

  /**
   * Converts raw currency values into integer cents while
   * preserving a required total.
   */
  private static allocateRawAmounts(
    rawAmounts: number[],
    targetTotalCents: number
  ): number[] {
    if (
      rawAmounts.length === 0
    ) {
      return [];
    }

    const rawCents =
      rawAmounts.map(
        (amount) =>
          amount * 100
      );

    const allocations =
      rawCents.map(
        (amount) =>
          amount >= 0
            ? Math.floor(amount)
            : Math.ceil(amount)
      );

    const currentTotal =
      allocations.reduce(
        (total, amount) =>
          total + amount,
        0
      );

    const difference =
      targetTotalCents -
      currentTotal;

    if (
      difference === 0
    ) {
      return allocations;
    }

    const residuals =
      rawCents.map(
        (amount, index) =>
          amount -
          allocations[index]
      );

    const orderedIndexes =
      rawAmounts.map(
        (_, index) =>
          index
      );

    orderedIndexes.sort(
      (
        firstIndex,
        secondIndex
      ) => {
        const firstResidual =
          residuals[firstIndex];

        const secondResidual =
          residuals[secondIndex];

        if (
          difference > 0
        ) {
          return (
            secondResidual -
              firstResidual ||
            firstIndex -
              secondIndex
          );
        }

        return (
          firstResidual -
            secondResidual ||
          firstIndex -
            secondIndex
        );
      }
    );

    const direction =
      difference > 0
        ? 1
        : -1;

    for (
      let step = 0;
      step <
      Math.abs(difference);
      step += 1
    ) {
      const allocationIndex =
        orderedIndexes[
          step %
          orderedIndexes.length
        ];

      allocations[
        allocationIndex
      ] += direction;
    }

    return allocations;
  }

  /**
   * Converts currency to integer cents.
   */
  private static toCents(
    amount: number
  ): number {
    return Math.round(
      amount * 100
    );
  }

  /**
   * Converts integer cents to currency.
   */
  private static fromCents(
    amount: number
  ): number {
    return amount / 100;
  }
}