import type {
  AuthHouseholdRole,
  HouseholdInvitation,
  HouseholdMembership,
  RemoteHousehold,
} from "../models";

export interface CreateRemoteHouseholdInput {
  name: string;
  ownerMemberId: string;
}

export interface InviteHouseholdMemberInput {
  householdId: string;
  email: string;
  role: AuthHouseholdRole;
}

export interface UpdateMembershipRoleInput {
  householdId: string;
  membershipId: string;
  role: AuthHouseholdRole;
}

export interface RemoteTenantRepository {
  createHousehold(
    input: CreateRemoteHouseholdInput
  ): Promise<RemoteHousehold>;

  getHousehold(
    householdId: string
  ): Promise<RemoteHousehold | undefined>;

  listHouseholds():
    Promise<RemoteHousehold[]>;

  listMemberships(
    householdId: string
  ): Promise<HouseholdMembership[]>;

  inviteMember(
    input: InviteHouseholdMemberInput
  ): Promise<HouseholdInvitation>;

  updateMembershipRole(
    input: UpdateMembershipRoleInput
  ): Promise<HouseholdMembership>;

  removeMembership(
    householdId: string,
    membershipId: string
  ): Promise<void>;
}
