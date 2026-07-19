import type { SettlementForm } from "../models/SettlementForm";
import type { SettlementApplicationForm } from "../models/SettlementApplicationForm";
import type { SettlementApplicationMethod } from "../models/Settlement";
import type {
  StoredAttachmentCategory,
} from "../../../shared/models/StoredAttachment";

export interface SettlementValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const applicationMethods:
  SettlementApplicationMethod[] = [
    "oldest-first",
    "manual",
  ];

const allowedAttachmentMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

const allowedAttachmentCategories:
  StoredAttachmentCategory[] = [
    "receipt",
    "bill",
    "other",
  ];

const maximumAttachmentCount = 3;

const maximumAttachmentSizeBytes =
  1024 * 1024;

const maximumTotalAttachmentSizeBytes =
  maximumAttachmentCount *
  maximumAttachmentSizeBytes;

export default class SettlementValidator {
  /**
   * Validates settlement form data before
   * service and persistence operations.
   */
  static validate(
    form: SettlementForm
  ): SettlementValidationResult {
    const errors: Record<string, string> = {};

    if (!form.householdId.trim()) {
      errors.householdId =
        "Household is required.";
    }

    this.validateMembers(
      form,
      errors
    );

    if (
      !Number.isFinite(form.amount) ||
      form.amount <= 0
    ) {
      errors.amount =
        "Settlement amount must be greater than zero.";
    }

    this.validateSettlementDate(
      form,
      errors
    );

    this.validateAccounts(
      form,
      errors
    );

    this.validateAttachments(
      form,
      errors
    );

    if (
      !applicationMethods.includes(
        form.applicationMethod
      )
    ) {
      errors.applicationMethod =
        "Select a valid settlement application method.";

      return {
        isValid:
          Object.keys(errors).length === 0,
        errors,
      };
    }

    if (
      form.applicationMethod ===
      "oldest-first"
    ) {
      this.validateOldestFirstApplications(
        form.applications,
        errors
      );
    }

    if (
      form.applicationMethod ===
      "manual"
    ) {
      this.validateManualApplications(
        form.applications,
        form.amount,
        errors
      );
    }

    return {
      isValid:
        Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validates the paying and receiving members.
   */
  private static validateMembers(
    form: SettlementForm,
    errors: Record<string, string>
  ): void {
    if (!form.fromMemberId.trim()) {
      errors.fromMemberId =
        "Select the member making the payment.";
    }

    if (!form.toMemberId.trim()) {
      errors.toMemberId =
        "Select the member receiving the payment.";
    }

    if (
      form.fromMemberId.trim() &&
      form.toMemberId.trim() &&
      form.fromMemberId ===
        form.toMemberId
    ) {
      errors.toMemberId =
        "A member cannot make a settlement payment to themselves.";
    }
  }

  /**
   * Validates the settlement date.
   */
  private static validateSettlementDate(
    form: SettlementForm,
    errors: Record<string, string>
  ): void {
    if (!form.settlementDate) {
      errors.settlementDate =
        "Settlement date is required.";

      return;
    }

    const settlementDate = new Date(
      `${form.settlementDate}T00:00:00`
    );

    if (
      Number.isNaN(
        settlementDate.getTime()
      )
    ) {
      errors.settlementDate =
        "Enter a valid settlement date.";
    }
  }

  /**
   * Validates optional source and destination accounts.
   */
  private static validateAccounts(
    form: SettlementForm,
    errors: Record<string, string>
  ): void {
    const sourceAccountId =
      form.sourceAccountId.trim();

    const destinationAccountId =
      form.destinationAccountId.trim();

    if (
      sourceAccountId &&
      destinationAccountId &&
      sourceAccountId ===
        destinationAccountId
    ) {
      errors.destinationAccountId =
        "Source and destination accounts must be different.";
    }
  }

  /**
   * Validates locally stored transfer receipts.
   */
  private static validateAttachments(
    form: SettlementForm,
    errors: Record<string, string>
  ): void {
    if (
      form.attachments.length >
      maximumAttachmentCount
    ) {
      errors.attachments =
        `Add no more than ${maximumAttachmentCount} transfer receipts.`;

      return;
    }

    const attachmentIds =
      new Set<string>();

    let totalSizeBytes = 0;

    for (
      const attachment of
      form.attachments
    ) {
      if (!attachment.id.trim()) {
        errors.attachments =
          "Every transfer receipt must include an ID.";

        return;
      }

      if (
        attachmentIds.has(
          attachment.id
        )
      ) {
        errors.attachments =
          "The same transfer receipt cannot be added more than once.";

        return;
      }

      attachmentIds.add(
        attachment.id
      );

      if (
        !allowedAttachmentCategories.includes(
          attachment.category
        )
      ) {
        errors.attachments =
          "Select a valid receipt category.";

        return;
      }

      if (!attachment.fileName.trim()) {
        errors.attachments =
          "Every transfer receipt must include a filename.";

        return;
      }

      if (
        !allowedAttachmentMimeTypes.includes(
          attachment.mimeType as
            typeof allowedAttachmentMimeTypes[number]
        )
      ) {
        errors.attachments =
          "Transfer receipts must be JPEG, PNG, WebP, or PDF files.";

        return;
      }

      if (
        !Number.isFinite(
          attachment.sizeBytes
        ) ||
        attachment.sizeBytes <= 0
      ) {
        errors.attachments =
          "Every transfer receipt must have a valid file size.";

        return;
      }

      if (
        attachment.sizeBytes >
        maximumAttachmentSizeBytes
      ) {
        errors.attachments =
          "Each transfer receipt must be 1 MB or smaller.";

        return;
      }

      totalSizeBytes +=
        attachment.sizeBytes;

      const expectedPrefix =
        `data:${attachment.mimeType};base64,`;

      if (
        !attachment.dataUrl.startsWith(
          expectedPrefix
        )
      ) {
        errors.attachments =
          "A transfer receipt contains invalid file data.";

        return;
      }

      const createdAt =
        new Date(
          attachment.createdAt
        );

      if (
        Number.isNaN(
          createdAt.getTime()
        )
      ) {
        errors.attachments =
          "A transfer receipt contains an invalid creation date.";

        return;
      }
    }

    if (
      totalSizeBytes >
      maximumTotalAttachmentSizeBytes
    ) {
      errors.attachments =
        "Combined transfer receipt size must be 3 MB or smaller.";
    }
  }

  /**
   * Oldest-first applications are generated
   * automatically by the settlement service.
   */
  private static validateOldestFirstApplications(
    applications: SettlementApplicationForm[],
    errors: Record<string, string>
  ): void {
    const hasManualValues =
      applications.some(
        (application) =>
          application.isSelected ||
          application.appliedAmount !== 0
      );

    if (hasManualValues) {
      errors.applications =
        "Oldest-first settlements cannot contain manual application amounts.";
    }
  }

  /**
   * Validates manually selected settlement applications.
   */
  private static validateManualApplications(
    applications: SettlementApplicationForm[],
    settlementAmount: number,
    errors: Record<string, string>
  ): void {
    if (applications.length === 0) {
      errors.applications =
        "Select at least one expense allocation.";

      return;
    }

    this.validateApplicationIds(
      applications,
      errors
    );

    if (errors.applications) {
      return;
    }

    const selectedApplications =
      applications.filter(
        (application) =>
          application.isSelected
      );

    if (
      selectedApplications.length === 0
    ) {
      errors.applications =
        "Select at least one expense allocation.";

      return;
    }

    const invalidUnselectedApplication =
      applications.some(
        (application) =>
          !application.isSelected &&
          application.appliedAmount !== 0
      );

    if (invalidUnselectedApplication) {
      errors.applications =
        "Unselected expense allocations must have a zero applied amount.";

      return;
    }

    const hasInvalidAmount =
      selectedApplications.some(
        (application) =>
          !Number.isFinite(
            application.appliedAmount
          ) ||
          application.appliedAmount <= 0
      );

    if (hasInvalidAmount) {
      errors.applications =
        "Every selected allocation must have an applied amount greater than zero.";

      return;
    }

    const applicationTotal =
      selectedApplications.reduce(
        (total, application) =>
          total +
          application.appliedAmount,
        0
      );

    if (
      !this.amountsMatch(
        applicationTotal,
        settlementAmount
      )
    ) {
      errors.applications =
        "Manual application amounts must equal the settlement amount.";
    }
  }

  /**
   * Ensures application allocation IDs
   * are present and unique.
   */
  private static validateApplicationIds(
    applications: SettlementApplicationForm[],
    errors: Record<string, string>
  ): void {
    const allocationIds =
      new Set<string>();

    for (const application of applications) {
      const expenseAllocationId =
        application.expenseAllocationId.trim();

      if (!expenseAllocationId) {
        errors.applications =
          "Every settlement application must reference an expense allocation.";

        return;
      }

      if (
        allocationIds.has(
          expenseAllocationId
        )
      ) {
        errors.applications =
          "An expense allocation cannot appear more than once in a settlement.";

        return;
      }

      allocationIds.add(
        expenseAllocationId
      );
    }
  }

  /**
   * Compares currency amounts using
   * cent-level precision.
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
