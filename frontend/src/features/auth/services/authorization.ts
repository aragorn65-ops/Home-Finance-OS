import type {
  Account,
} from "../../accounts/models/Account";
import type {
  HouseholdMember,
} from "../../household/models/HouseholdMember";
import type {
  AuthHouseholdRole,
  HouseholdMembership,
  RemoteTenantRecord,
} from "../models";

export interface AuthorizationContext {
  userId?: string;
  memberId?: HouseholdMember["id"];
  membership?: HouseholdMembership;
}

export type HouseholdAction =
  | "view-household"
  | "edit-household"
  | "invite-member"
  | "change-member-role"
  | "remove-member"
  | "transfer-ownership"
  | "import-backup"
  | "delete-household";

export type FinancialRecordAction =
  | "view"
  | "create"
  | "update"
  | "delete";

const householdActionRoles:
  Record<
    HouseholdAction,
    AuthHouseholdRole[]
  > = {
    "view-household": [
      "owner",
      "admin",
      "member",
      "viewer",
    ],
    "edit-household": [
      "owner",
      "admin",
    ],
    "invite-member": [
      "owner",
      "admin",
    ],
    "change-member-role": [
      "owner",
    ],
    "remove-member": [
      "owner",
      "admin",
    ],
    "transfer-ownership": [
      "owner",
    ],
    "import-backup": [
      "owner",
    ],
    "delete-household": [
      "owner",
    ],
  };

export function canAccessHousehold(
  context: AuthorizationContext,
  householdId: string,
  action: HouseholdAction
): boolean {
  const membership =
    context.membership;

  return Boolean(
    membership &&
      membership.householdId ===
        householdId &&
      membership.status ===
        "active" &&
      householdActionRoles[
        action
      ].includes(membership.role)
  );
}

export function canAccessAccount(
  context: AuthorizationContext,
  account: Account,
  action: FinancialRecordAction
): boolean {
  return canAccessTenantRecord(
    context,
    {
      id: account.id,
      householdId:
        account.householdId,
      visibility:
        account.visibility,
      ownerMemberId:
        account.ownerMemberId,
      createdAt:
        account.createdAt,
      updatedAt:
        account.updatedAt,
    },
    action
  );
}

export function canAccessTenantRecord(
  context: AuthorizationContext,
  record: RemoteTenantRecord,
  action: FinancialRecordAction
): boolean {
  const membership =
    context.membership;

  if (
    !membership ||
    membership.status !== "active" ||
    membership.householdId !==
      record.householdId
  ) {
    return false;
  }

  if (
    membership.role === "viewer"
  ) {
    return action === "view";
  }

  if (
    record.visibility !== "private"
  ) {
    return true;
  }

  return (
    record.ownerMemberId ===
    context.memberId
  );
}

export function canManageMemberRole(
  context: AuthorizationContext,
  targetRole: AuthHouseholdRole
): boolean {
  const role =
    context.membership?.role;

  if (role === "owner") {
    return true;
  }

  return (
    role === "admin" &&
    targetRole !== "owner"
  );
}
