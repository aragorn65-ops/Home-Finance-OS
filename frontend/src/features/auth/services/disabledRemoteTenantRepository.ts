import type {
  HouseholdInvitation,
  HouseholdMembership,
  RemoteHousehold,
} from "../models";
import type {
  CreateRemoteHouseholdInput,
  InviteHouseholdMemberInput,
  RemoteTenantRepository,
  UpdateMembershipRoleInput,
} from "./RemoteTenantRepository";

export class DisabledRemoteTenantRepository
  implements RemoteTenantRepository
{
  async createHousehold(
    input: CreateRemoteHouseholdInput
  ): Promise<RemoteHousehold> {
    throw new Error(
      `Remote household creation is disabled for ${input.name}.`
    );
  }

  async getHousehold():
    Promise<RemoteHousehold | undefined> {
    return undefined;
  }

  async listHouseholds():
    Promise<RemoteHousehold[]> {
    return [];
  }

  async listMemberships():
    Promise<HouseholdMembership[]> {
    return [];
  }

  async inviteMember(
    input: InviteHouseholdMemberInput
  ): Promise<HouseholdInvitation> {
    throw new Error(
      `Remote invitations are disabled for ${input.email}.`
    );
  }

  async updateMembershipRole(
    input: UpdateMembershipRoleInput
  ): Promise<HouseholdMembership> {
    throw new Error(
      `Remote role changes are disabled for ${input.membershipId}.`
    );
  }

  async removeMembership(
    _householdId: string,
    membershipId: string
  ): Promise<void> {
    throw new Error(
      `Remote membership removal is disabled for ${membershipId}.`
    );
  }
}
