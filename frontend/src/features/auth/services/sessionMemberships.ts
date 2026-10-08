import type { AuthSession, HouseholdMembership } from "../models";

export function getSessionMemberships(
  memberships: HouseholdMembership[],
  session: AuthSession,
  householdId?: string
): HouseholdMembership[] {
  if (session.status !== "signed-in" || !session.user?.id) return [];
  return memberships.filter((membership) =>
    membership.userId === session.user!.id && membership.status === "active" &&
    (!householdId || membership.householdId === householdId)
  );
}
