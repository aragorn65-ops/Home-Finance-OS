import type { SettlementForm } from "../models/SettlementForm";

export function preserveRecordedApplications(
  draft: SettlementForm,
  original: SettlementForm | undefined,
  applicationEditorOpened: boolean
): SettlementForm {
  if (!original || applicationEditorOpened ||
      draft.householdId !== original.householdId ||
      draft.fromMemberId !== original.fromMemberId ||
      draft.toMemberId !== original.toMemberId ||
      draft.amount !== original.amount ||
      draft.applicationMethod !== original.applicationMethod ||
      draft.sourceAccountId !== original.sourceAccountId ||
      draft.destinationAccountId !== original.destinationAccountId ||
      draft.isActive !== original.isActive) return draft;

  // Receipt, note and date edits retain the recorded payment links, even if
  // those expenses are absent from the current unpaid-item picker.
  return { ...draft, applications: original.applications.map((item) => ({ ...item })) };
}
