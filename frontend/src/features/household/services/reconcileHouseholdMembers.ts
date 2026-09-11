import type { HouseholdMember } from "../models/HouseholdMember";

// Keep financial references stable; names are not identity keys.
export function reconcileHouseholdMembers(
  local: HouseholdMember[],
  remote: HouseholdMember[],
  householdId: string
): HouseholdMember[] {
  const groups = new Map<HouseholdMember, HouseholdMember[]>();
  const result: HouseholdMember[] = [];
  for (const member of local) {
    const match =
      (member.userId ? remote.find((item) => item.userId === member.userId) : undefined) ??
      (member.remoteMemberId ? remote.find((item) => item.remoteMemberId === member.remoteMemberId) : undefined) ??
      remote.find((item) => item.id === member.id || item.remoteMemberId === member.id);
    if (!match) {
      result.push(member);
      continue;
    }
    groups.set(match, [...(groups.get(match) ?? []), member]);
  }
  for (const [match, candidates] of groups) {
    // After a cloud repair, the UUID row and its old local alias may both be cached.
    const member = candidates.find((item) => match.userId && item.userId === match.userId) ??
      candidates.find((item) => match.remoteMemberId && item.remoteMemberId === match.remoteMemberId) ??
      candidates[0];
    if (!match.userId && match.displayName === match.id && member.displayName !== member.id) {
      result.push(...candidates);
      continue;
    }
    result.push({
      ...member,
      ...match,
      id: member.id,
      householdId,
      userId: match.userId ?? member.userId,
      email: match.email ?? member.email,
      referenceIds: [...new Set([
        ...candidates.flatMap((item) => [item.id, ...(item.referenceIds ?? []), ...(item.remoteMemberId ? [item.remoteMemberId] : [])]),
        ...(match.referenceIds ?? []),
        match.id,
        ...(match.remoteMemberId ? [match.remoteMemberId] : []),
      ])].filter((id) => id !== member.id).sort(),
      color: match.color ?? member.color,
    });
  }
  for (const member of remote) {
    if (!groups.has(member) && !result.some((item) => item.id === member.id || item.referenceIds?.includes(member.id))) {
      result.push({ ...member, householdId });
    }
  }
  return result.sort((a, b) => {
    const rank = { owner: 0, admin: 1, member: 2 };
    return rank[a.role] - rank[b.role] || a.displayName.localeCompare(b.displayName) || a.id.localeCompare(b.id);
  });
}
