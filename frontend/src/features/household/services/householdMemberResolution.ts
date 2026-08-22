import type { HouseholdMember } from "../models/HouseholdMember";

import HouseholdMemberService from "./HouseholdMemberService";

export function resolveHouseholdMemberReference(
  members: HouseholdMember[],
  memberId: string
): HouseholdMember | undefined {
  const value =
    memberId.trim();
  const normalizedValue =
    value.toLowerCase();

  if (!value) {
    return undefined;
  }

  return members.find(
    (member) =>
      member.id === value ||
      member.remoteMemberId ===
        value ||
      member.email
        ?.trim()
        .toLowerCase() ===
        normalizedValue
  );
}

export function findHouseholdMemberByReference(
  memberId: string,
  householdId?: string
): HouseholdMember | undefined {
  const members =
    HouseholdMemberService
      .getMembers()
      .filter(
        (member) =>
          !householdId ||
          member.householdId ===
            householdId
      );

  return resolveHouseholdMemberReference(
    members,
    memberId
  );
}
