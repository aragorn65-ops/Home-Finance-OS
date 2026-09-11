import type { HouseholdMember } from "../models/HouseholdMember";

// Keep financial references stable; names are not identity keys.
export function reconcileHouseholdMembers(
  local: HouseholdMember[],
  remote: HouseholdMember[],
  householdId: string
): HouseholdMember[] {
  const used = new Set<HouseholdMember>();
  const result = local.map((member) => {
    const match =
      (member.userId ? remote.find((item) => item.userId === member.userId) : undefined) ??
      (member.remoteMemberId ? remote.find((item) => item.remoteMemberId === member.remoteMemberId) : undefined) ??
      remote.find((item) => item.id === member.id);
    if (!match) return member;
    used.add(match);
    if (!match.userId && match.displayName === match.id && member.displayName !== member.id) {
      return member;
    }
    return {
      ...member,
      ...match,
      id: member.id,
      householdId,
      userId: match.userId ?? member.userId,
      email: match.email ?? member.email,
      referenceIds: [...new Set([
        ...(member.referenceIds ?? []),
        ...(match.referenceIds ?? []),
        match.id,
      ])].filter((id) => id !== member.id),
      color: match.color ?? member.color,
    };
  });
  for (const member of remote) {
    if (!used.has(member) && !result.some((item) => item.id === member.id)) {
      result.push({ ...member, householdId });
    }
  }
  return result.sort((a, b) => {
    const rank = { owner: 0, admin: 1, member: 2 };
    return rank[a.role] - rank[b.role] || a.displayName.localeCompare(b.displayName) || a.id.localeCompare(b.id);
  });
}
