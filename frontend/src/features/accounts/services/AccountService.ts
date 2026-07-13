/**
 * Updates an existing account.
 */
static update(
  id: string,
  form: AccountForm
): OperationResult<Account> {
  const existing = AccountRepository.findById(id);

  if (!existing) {
    return OperationResults.failure<Account>(
      ["Account not found."],
      "Unable to update account."
    );
  }

  const validation = AccountValidator.validate(form);

  if (!validation.isValid) {
    return OperationResults.failure<Account>(
      validation.errors,
      "Please correct the validation errors."
    );
  }

  const updatedAccount: Account = {
    ...existing,

    name: form.name.trim(),
    institution: form.institution?.trim() || undefined,

    type: form.type as Account["type"],

    currency: form.currency,

    openingBalance: form.balance,

    isActive: form.isActive,

    updatedAt: new Date(),
  };

  AccountRepository.update(updatedAccount);

  return OperationResults.success(
    updatedAccount,
    "Account updated successfully."
  );
}