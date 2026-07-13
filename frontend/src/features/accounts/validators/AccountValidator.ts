import type { AccountForm } from "../models/AccountForm";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export default class AccountValidator {
  static validate(account: AccountForm): ValidationResult {
    const errors: Record<string, string> = {};

    if (!account.name.trim()) {
      errors.name = "Account name is required.";
    }

    if (!account.type.trim()) {
      errors.type = "Account type is required.";
    }

    if (!account.currency.trim()) {
      errors.currency = "Currency is required.";
    }

    if (account.balance < 0) {
      errors.balance = "Opening balance cannot be negative.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}