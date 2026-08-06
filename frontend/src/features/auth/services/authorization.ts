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
  memberIds?: HouseholdMember["id"][];
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

export type SettlementRecordAction =
  | FinancialRecordAction
  | "review";

export interface SettlementAccessRecord {
  householdId: string;
  fromMemberId: string;
  toMemberId: string;
}

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
  const membership =
    context.membership;

  if (
    !membership ||
    membership.status !== "active" ||
    membership.householdId !==
      account.householdId
  ) {
    return false;
  }

  const isPersonalAccount =
    account.visibility === "private";
  const isOwnPersonalAccount =
    isPersonalAccount &&
    getAuthorizedMemberIds(
      context
    ).includes(account.ownerMemberId);

  if (
    membership.role === "owner" ||
    membership.role === "admin"
  ) {
    if (
      isPersonalAccount &&
      !isOwnPersonalAccount
    ) {
      return action === "delete";
    }

    return true;
  }

  if (membership.role === "viewer") {
    return (
      action === "view" &&
      (
        !isPersonalAccount ||
        isOwnPersonalAccount
      )
    );
  }

  if (membership.role !== "member") {
    return false;
  }

  if (!isPersonalAccount) {
    return action === "view";
  }

  if (!isOwnPersonalAccount) {
    return false;
  }

  return true;
}

export function canAccessSettlementRecord(
  context: AuthorizationContext,
  settlement: SettlementAccessRecord,
  action: SettlementRecordAction
): boolean {
  const membership =
    context.membership;

  if (
    !membership ||
    membership.status !== "active" ||
    membership.householdId !==
      settlement.householdId
  ) {
    return false;
  }

  if (
    membership.role === "owner" ||
    membership.role === "admin"
  ) {
    return true;
  }

  if (
    membership.role !== "member" ||
    !context.memberId
  ) {
    return false;
  }

  const memberIsParticipant =
    settlement.fromMemberId ===
      context.memberId ||
    settlement.toMemberId ===
      context.memberId;

  if (!memberIsParticipant) {
    return false;
  }

  return (
    action === "create" ||
    action === "view"
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
    membership.role === "owner" ||
    membership.role === "admin"
  ) {
    return true;
  }

  if (
    action !== "view"
  ) {
    return false;
  }

  if (
    record.visibility !== "private"
  ) {
    return true;
  }

  if (!record.ownerMemberId) {
    return false;
  }

  return getAuthorizedMemberIds(
    context
  ).includes(record.ownerMemberId);
}

function getAuthorizedMemberIds(
  context: AuthorizationContext
): string[] {
  return [
    context.memberId,
    ...(context.memberIds ?? []),
  ].filter(
    (
      memberId,
      index,
      memberIds
    ): memberId is string =>
      Boolean(memberId) &&
      memberIds.indexOf(memberId) ===
        index
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
