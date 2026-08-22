export type HouseholdMemberRole =
  | "owner"
  | "admin"
  | "member";

export interface HouseholdMember {
  id: string;
  householdId: string;

  /**
   * Optional application user linked to this member.
   *
   * A household member may exist before receiving
   * an application account or invitation.
   */
  userId?: string;
  email?: string;
  remoteMemberId?: string;

  displayName: string;
  role: HouseholdMemberRole;

  /**
   * Optional presentation color used in member summaries,
   * allocations, and settlement views.
   */
  color?: string;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
