import type { HouseholdMember } from "../models/HouseholdMember";

import HouseholdMemberService from "./HouseholdMemberService";
import {
  loadHousehold,
} from "./householdStorage";

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

export function createHouseholdMemberNameLookup(
  members: HouseholdMember[],
  ownerMemberId?: string
): Record<string, string> {
  const lookup: Record<string, string> =
    {};

  members.forEach((member) => {
    [
      member.id,
      member.remoteMemberId,
      member.email,
      member.email
        ?.trim()
        .toLowerCase(),
    ].forEach((alias) => {
      const key =
        alias?.trim();

      if (key) {
        lookup[key] =
          member.displayName;
      }
    });

    if (
      member.role === "owner" &&
      (
        member.id === ownerMemberId ||
        member.remoteMemberId ===
          ownerMemberId
      )
    ) {
      lookup["member-001"] =
        member.displayName;
    }
  });

  return lookup;
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

  const directMatch =
    resolveHouseholdMemberReference(
      members,
      memberId
    );

  if (directMatch) {
    return directMatch;
  }

  const household =
    loadHousehold();
  const value =
    memberId.trim();
  const ownerMemberId =
    household?.id === householdId ||
    !householdId
      ? household?.authenticatedLink
          ?.ownerMemberId
      : undefined;
  const isOwnerAlias =
    value === "member-001" ||
    (
      ownerMemberId &&
      value === ownerMemberId
    );

  if (!isOwnerAlias) {
    return undefined;
  }

  return members.find(
    (member) =>
      member.role === "owner" &&
      member.isActive
  );
}

export function resolveSingleUnmatchedMember(
  members: HouseholdMember[],
  unresolvedMemberId: string,
  knownMemberIds: string[]
): HouseholdMember | undefined {
  if (
    resolveHouseholdMemberReference(
      members,
      unresolvedMemberId
    )
  ) {
    return undefined;
  }

  const knownMembers =
    knownMemberIds
      .map((memberId) =>
        resolveHouseholdMemberReference(
          members,
          memberId
        )
      )
      .filter(
        (
          member
        ): member is HouseholdMember =>
          Boolean(member)
      );
  const knownLocalIds =
    new Set(
      knownMembers.map(
        (member) => member.id
      )
    );
  const candidates =
    members.filter(
      (member) =>
        member.isActive &&
        !knownLocalIds.has(member.id)
    );

  return candidates.length === 1
    ? candidates[0]
    : undefined;
}
