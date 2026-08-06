import type {
  Account,
  AccountVisibility,
} from "../models/Account";

export interface AccountVisibilityRecord {
  ownerMemberId: Account["ownerMemberId"];
  visibility: AccountVisibility;
}

export function isAccountVisibleForMember(
  account: AccountVisibilityRecord,
  memberId: string
): boolean {
  return (
    account.visibility === "household" ||
    account.ownerMemberId === memberId
  );
}

export function getAccountVisibilityLabel(
  account: AccountVisibilityRecord
): string {
  return account.visibility === "private"
    ? "Personal"
    : "Household";
}
