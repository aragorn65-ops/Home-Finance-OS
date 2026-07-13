import type {
  HouseholdMemberRole,
} from "../models/HouseholdMember";

import type {
  HouseholdMemberForm,
} from "../models/HouseholdMemberForm";

export interface HouseholdMemberValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const validRoles: HouseholdMemberRole[] = [
  "owner",
  "admin",
  "member",
];

export default class HouseholdMemberValidator {
  /**
   * Validates household-member form data.
   */
  static validate(
    form: HouseholdMemberForm
  ): HouseholdMemberValidationResult {
    const errors: Record<string, string> = {};

    const displayName =
      form.displayName.trim();

    if (!displayName) {
      errors.displayName =
        "Member name is required.";
    } else if (displayName.length < 2) {
      errors.displayName =
        "Member name must contain at least 2 characters.";
    } else if (displayName.length > 60) {
      errors.displayName =
        "Member name cannot exceed 60 characters.";
    }

    if (!validRoles.includes(form.role)) {
      errors.role =
        "Select a valid household role.";
    }

    const color =
      form.color.trim();

    if (
      color &&
      !/^#[0-9a-fA-F]{6}$/.test(color)
    ) {
      errors.color =
        "Enter a valid six-digit hex color, such as #688F24.";
    }

    return {
      isValid:
        Object.keys(errors).length === 0,
      errors,
    };
  }
}