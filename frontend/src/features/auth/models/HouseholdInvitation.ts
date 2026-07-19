import type {
  AuthHouseholdRole,
} from "./HouseholdMembership";

export type HouseholdInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "revoked";

export interface HouseholdInvitation {
  id: string;
  householdId: string;
  email: string;
  role: AuthHouseholdRole;
  invitedByUserId: string;
  status: HouseholdInvitationStatus;
  expiresAt: Date;
  acceptedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}
