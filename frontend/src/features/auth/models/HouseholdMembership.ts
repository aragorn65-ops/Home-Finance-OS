import type {
  HouseholdMemberRole,
} from "../../household/models/HouseholdMember";

export type AuthHouseholdRole =
  | HouseholdMemberRole
  | "viewer";

export type HouseholdMembershipStatus =
  | "active"
  | "invited"
  | "declined"
  | "removed";

export interface HouseholdMembership {
  id: string;
  householdId: string;
  userId: string;
  memberId: string;
  memberDisplayName?: string;
  role: AuthHouseholdRole;
  status: HouseholdMembershipStatus;
  invitedByUserId?: string;
  invitedAt?: Date;
  acceptedAt?: Date;
  removedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
