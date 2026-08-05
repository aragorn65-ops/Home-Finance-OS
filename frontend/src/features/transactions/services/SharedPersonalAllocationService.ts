import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types/index";

export interface SharedPersonalAllocationInput {
  /**
   * Household member receiving the allocation.
   */
  memberId: string;

  /**
   * False means the member does not participate
   * in the common expense.
   */
  isIncluded: boolean;

  /**
   * Items used only by this member.
   *
   * Personal amounts are added after calculating
   * the member's equal share of the common amount.
   */
  personalAmount: number;
}

export interface SharedPersonalMemberAllocation {
  memberId: string;
  isIncluded: boolean;

  /**
   * Personal items assigned exclusively to the member.
   */
  personalAmount: number;

  /**
   * Equal portion of the common expense.
   */
  commonShareAmount: number;

  /**
   * Final member responsibility.
   *
   * commonShareAmount + personalAmount
   */
  allocatedAmount: number;
}

export interface SharedPersonalAllocationCalculation {
  totalAmount: number;
  personalTotal: number;
  commonAmount: number;
  includedMemberCount: number;
  allocations: SharedPersonalMemberAllocation[];
}

export default class SharedPersonalAllocationService {
  /**
   * Divides the common portion equally among included
   * members and adds each member's personal amount.
   *
   * Currency calculations use cent-level precision.
   */
  static calculate(
    totalAmount: number,
    inputs: SharedPersonalAllocationInput[]
  ): OperationResult<SharedPersonalAllocationCalculation> {
    if (
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0
    ) {
      return OperationResults.failure(
        {
          amount:
            "Expense amount must be greater than zero.",
        },
        "Unable to calculate the shared and personal expense."
      );
    }

    if (inputs.length === 0) {
      return OperationResults.failure(
        {
          allocations:
            "Add at least one household member.",
        },
        "Unable to calculate the shared and personal expense."
      );
    }

    const memberIds = new Set<string>();

    for (const input of inputs) {
      const memberId =
        input.memberId.trim();

      if (!memberId) {
        return OperationResults.failure(
          {
            allocations:
              "Every allocation must reference a household member.",
          },
          "Unable to calculate the shared and personal expense."
        );
      }

      if (memberIds.has(memberId)) {
        return OperationResults.failure(
          {
            allocations:
              "A household member cannot appear more than once.",
          },
          "Unable to calculate the shared and personal expense."
        );
      }

      memberIds.add(memberId);

      if (
        !Number.isFinite(
          input.personalAmount
        ) ||
        input.personalAmount < 0
      ) {
        return OperationResults.failure(
          {
            allocations:
              "Personal amounts must be valid non-negative values.",
          },
          "Unable to calculate the shared and personal expense."
        );
      }

      if (
        !input.isIncluded &&
        input.personalAmount !== 0
      ) {
        return OperationResults.failure(
          {
            allocations:
              "Opted-out members cannot have personal or common allocations.",
          },
          "Unable to calculate the shared and personal expense."
        );
      }
    }

    const includedInputs =
      inputs.filter(
        (input) =>
          input.isIncluded
      );

    if (includedInputs.length === 0) {
      return OperationResults.failure(
        {
          allocations:
            "At least one member must participate in the expense.",
        },
        "Unable to calculate the shared and personal expense."
      );
    }

    const totalCents =
      this.toCents(totalAmount);

    const personalTotalCents =
      includedInputs.reduce(
        (total, input) =>
          total +
          this.toCents(
            input.personalAmount
          ),
        0
      );

    if (
      personalTotalCents >
      totalCents
    ) {
      return OperationResults.failure(
        {
          allocations:
            "The total personal amount cannot exceed the total expense amount.",
        },
        "Unable to calculate the shared and personal expense."
      );
    }

    const commonAmountCents =
      totalCents -
      personalTotalCents;

    const baseCommonShareCents =
      Math.floor(
        commonAmountCents /
          includedInputs.length
      );

    const remainderCents =
      commonAmountCents -
      baseCommonShareCents *
        includedInputs.length;

    let includedIndex = 0;

    const allocations =
      inputs.map(
        (
          input
        ): SharedPersonalMemberAllocation => {
          if (!input.isIncluded) {
            return {
              memberId:
                input.memberId.trim(),

              isIncluded: false,

              personalAmount: 0,
              commonShareAmount: 0,
              allocatedAmount: 0,
            };
          }

          const isLastIncludedMember =
            includedIndex ===
            includedInputs.length - 1;

          const commonShareCents =
            baseCommonShareCents +
            (isLastIncludedMember
              ? remainderCents
              : 0);

          const personalAmountCents =
            this.toCents(
              input.personalAmount
            );

          includedIndex += 1;

          return {
            memberId:
              input.memberId.trim(),

            isIncluded: true,

            personalAmount:
              this.fromCents(
                personalAmountCents
              ),

            commonShareAmount:
              this.fromCents(
                commonShareCents
              ),

            allocatedAmount:
              this.fromCents(
                commonShareCents +
                  personalAmountCents
              ),
          };
        }
      );

    const allocationTotalCents =
      allocations.reduce(
        (total, allocation) =>
          total +
          this.toCents(
            allocation.allocatedAmount
          ),
        0
      );

    if (
      allocationTotalCents !==
      totalCents
    ) {
      return OperationResults.failure(
        {
          allocations:
            "Calculated member allocations do not equal the total expense amount.",
        },
        "Unable to calculate the shared and personal expense."
      );
    }

    return OperationResults.success(
      {
        totalAmount:
          this.fromCents(
            totalCents
          ),

        personalTotal:
          this.fromCents(
            personalTotalCents
          ),

        commonAmount:
          this.fromCents(
            commonAmountCents
          ),

        includedMemberCount:
          includedInputs.length,

        allocations,
      },
      "Shared and personal allocations calculated successfully."
    );
  }

  private static toCents(
    amount: number
  ): number {
    return Math.round(
      amount * 100
    );
  }

  private static fromCents(
    amount: number
  ): number {
    return amount / 100;
  }
}
