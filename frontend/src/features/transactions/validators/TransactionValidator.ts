import type { ExpenseAllocationForm } from "../models/ExpenseAllocationForm";
import type {
  ExpenseSplitMethod,
} from "../models/ExpenseAllocation";
import type { TransactionForm } from "../models/TransactionForm";
import type { TransactionVisibility } from "../models/Transaction";

export interface TransactionValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const transactionVisibilities:
  TransactionVisibility[] = [
    "household",
    "participants",
    "private",
  ];

const allowedSplitMethods:
  ExpenseSplitMethod[] = [
    "none",
    "equal",
    "exact",
    "shared-personal",
    "submeter",
  ];

export default class TransactionValidator {
  /**
   * Validates transaction form data before persistence.
   */
  static validate(
    form: TransactionForm
  ): TransactionValidationResult {
    const errors: Record<string, string> = {};

    if (
      !["income", "expense", "transfer"].includes(
        form.type
      )
    ) {
      errors.type =
        "Select a valid transaction type.";
    }

    if (
      !Number.isFinite(form.amount) ||
      form.amount <= 0
    ) {
      errors.amount =
        "Transaction amount must be greater than zero.";
    }

    if (
      !transactionVisibilities.includes(
        form.visibility
      )
    ) {
      errors.visibility =
        "Select a valid transaction visibility.";
    }

    if (!form.category.trim()) {
      errors.category =
        "Category is required.";
    }

    if (
      form.type !== "expense" &&
      !form.description.trim()
    ) {
      errors.description =
        "Description is required.";
    }

    this.validateTransactionDate(
      form,
      errors
    );

    this.validateAccounts(
      form,
      errors
    );

    this.validateExpenseDetails(
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
   * Validates the transaction date.
   */
  private static validateTransactionDate(
    form: TransactionForm,
    errors: Record<string, string>
  ): void {
    if (!form.transactionDate) {
      errors.transactionDate =
        "Transaction date is required.";

      return;
    }

    const transactionDate = new Date(
      `${form.transactionDate}T00:00:00`
    );

    if (
      Number.isNaN(
        transactionDate.getTime()
      )
    ) {
      errors.transactionDate =
        "Enter a valid transaction date.";
    }
  }

  /**
   * Validates source and destination account fields.
   */
  private static validateAccounts(
    form: TransactionForm,
    errors: Record<string, string>
  ): void {
    if (form.type === "income") {
      if (
        !form.destinationAccountId.trim()
      ) {
        errors.destinationAccountId =
          "Select the account receiving the income.";
      }

      return;
    }

    if (form.type === "expense") {
      return;
    }

    if (!form.sourceAccountId.trim()) {
      errors.sourceAccountId =
        "Select the source account.";
    }

    if (
      !form.destinationAccountId.trim()
    ) {
      errors.destinationAccountId =
        "Select the destination account.";
    }

    if (
      form.sourceAccountId.trim() &&
      form.destinationAccountId.trim() &&
      form.sourceAccountId ===
        form.destinationAccountId
    ) {
      errors.destinationAccountId =
        "Source and destination accounts must be different.";
    }
  }

  /**
   * Validates payer and allocation details for expenses.
   */
  private static validateExpenseDetails(
    form: TransactionForm,
    errors: Record<string, string>
  ): void {
    if (form.type !== "expense") {
      if (form.splitMethod !== "none") {
        errors.splitMethod =
          "Income and transfer transactions cannot be divided among members.";
      }

      if (form.allocations.length > 0) {
        errors.allocations =
          "Income and transfer transactions cannot contain expense allocations.";
      }

      return;
    }

    if (!form.paidByMemberId.trim()) {
      errors.paidByMemberId =
        "Select the member who paid the expense.";
    }

    if (
      !allowedSplitMethods.includes(
        form.splitMethod
      )
    ) {
      errors.splitMethod =
        "Select a valid expense split method.";

      return;
    }

    if (form.splitMethod === "none") {
      if (form.allocations.length > 0) {
        errors.allocations =
          "Individual expenses should not contain member allocations.";
      }

      return;
    }

    if (form.allocations.length === 0) {
      errors.allocations =
        "Add at least one household member to the expense split.";

      return;
    }

    this.validateAllocationMembers(
      form.allocations,
      errors
    );

    const includedAllocations =
      form.allocations.filter(
        (allocation) =>
          allocation.isIncluded
      );

    if (
      includedAllocations.length === 0
    ) {
      errors.allocations =
        "At least one member must participate in the expense.";

      return;
    }

    this.validateOptedOutAllocations(
      form.allocations,
      errors
    );

    if (errors.allocations) {
      return;
    }

    if (form.splitMethod === "equal") {
      return;
    }

    if (form.splitMethod === "exact") {
      this.validateExactAllocations(
        includedAllocations,
        form.amount,
        errors
      );

      return;
    }

    if (
      form.splitMethod ===
      "shared-personal"
    ) {
      this.validateSharedPersonalAllocations(
        includedAllocations,
        form.amount,
        errors
      );

      return;
    }

    this.validateSubmeterExpense(
      form,
      includedAllocations,
      errors
    );
  }

  /**
   * Ensures allocation members are present and unique.
   */
  private static validateAllocationMembers(
    allocations: ExpenseAllocationForm[],
    errors: Record<string, string>
  ): void {
    const memberIds = new Set<string>();

    for (const allocation of allocations) {
      const memberId =
        allocation.memberId.trim();

      if (!memberId) {
        errors.allocations =
          "Every expense allocation must reference a household member.";

        return;
      }

      if (memberIds.has(memberId)) {
        errors.allocations =
          "A household member cannot appear more than once in an expense split.";

        return;
      }

      memberIds.add(memberId);
    }
  }

  /**
   * Ensures opted-out members receive no common
   * or personal allocation.
   */
  private static validateOptedOutAllocations(
    allocations: ExpenseAllocationForm[],
    errors: Record<string, string>
  ): void {
    const invalidOptOut =
      allocations.some(
        (allocation) =>
          !allocation.isIncluded &&
          (
            allocation.allocatedAmount !== 0 ||
            (
              allocation.personalAmount ??
              0
            ) !== 0
          )
      );

    if (invalidOptOut) {
      errors.allocations =
        "Members who opt out must have zero allocated and personal amounts.";
    }
  }

  /**
   * Validates exact member allocations.
   */
  private static validateExactAllocations(
    allocations: ExpenseAllocationForm[],
    transactionAmount: number,
    errors: Record<string, string>
  ): void {
    const hasInvalidAmount =
      allocations.some(
        (allocation) =>
          !Number.isFinite(
            allocation.allocatedAmount
          ) ||
          allocation.allocatedAmount < 0
      );

    if (hasInvalidAmount) {
      errors.allocations =
        "Every included member must have a valid non-negative allocation.";

      return;
    }

    const allocationTotal =
      allocations.reduce(
        (total, allocation) =>
          total +
          allocation.allocatedAmount,
        0
      );

    if (
      !this.amountsMatch(
        allocationTotal,
        transactionAmount
      )
    ) {
      errors.allocations =
        "Exact member allocations must equal the total expense amount.";
    }
  }

  /**
   * Validates personal-item amounts before the common
   * amount is divided between participating members.
   */
  private static validateSharedPersonalAllocations(
    allocations: ExpenseAllocationForm[],
    transactionAmount: number,
    errors: Record<string, string>
  ): void {
    const hasInvalidPersonalAmount =
      allocations.some(
        (allocation) =>
          !Number.isFinite(
            allocation.personalAmount
          ) ||
          allocation.personalAmount < 0
      );

    if (hasInvalidPersonalAmount) {
      errors.allocations =
        "Every included member must have a valid non-negative personal amount.";

      return;
    }

    const personalTotal =
      allocations.reduce(
        (total, allocation) =>
          total +
          allocation.personalAmount,
        0
      );

    if (
      Math.round(
        personalTotal * 100
      ) >
      Math.round(
        transactionAmount * 100
      )
    ) {
      errors.allocations =
        "The total personal amount cannot exceed the total expense amount.";
    }
  }

  /**
   * Ensures submeter splitting is limited to supported
   * utility expense categories.
   *
   * Detailed meter and appliance calculations will be
   * validated by the utility allocation service.
   */
  private static validateSubmeterExpense(
    form: TransactionForm,
    includedAllocations:
      ExpenseAllocationForm[],
    errors: Record<string, string>
  ): void {
    const normalizedCategory =
      form.category
        .trim()
        .toLowerCase();

    const isSupportedUtility =
      normalizedCategory.includes(
        "electricity"
      ) ||
      normalizedCategory.includes(
        "water"
      );

    if (!isSupportedUtility) {
      errors.splitMethod =
        "Submeter splitting is only available for Electricity or Water expenses.";
    }

    if (
      includedAllocations.length === 0
    ) {
      errors.allocations =
        "At least one member must participate in the utility expense.";
    }
  }

  /**
   * Compares currency amounts using cent-level precision.
   */
  private static amountsMatch(
    firstAmount: number,
    secondAmount: number
  ): boolean {
    return (
      Math.round(firstAmount * 100) ===
      Math.round(secondAmount * 100)
    );
  }
}