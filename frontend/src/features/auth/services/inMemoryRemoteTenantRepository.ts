import type {
  HouseholdInvitation,
  HouseholdMembership,
  RemoteHousehold,
} from "../models";
import {
  createId,
  InMemoryAuthStore,
} from "./inMemoryAuthStore";
import type {
  CreateRemoteHouseholdInput,
  InviteHouseholdMemberInput,
  RemoteTenantRepository,
  UpdateMembershipRoleInput,
} from "./RemoteTenantRepository";

export class InMemoryRemoteTenantRepository
  implements RemoteTenantRepository
{
  private readonly store:
    InMemoryAuthStore;

  constructor(
    store: InMemoryAuthStore
  ) {
    this.store = store;
  }

  async createHousehold(
    input: CreateRemoteHouseholdInput
  ): Promise<RemoteHousehold> {
    const now = new Date();

    return this.store.saveHousehold({
      id:
        createId("household"),
      name:
        input.name,
      ownerMemberId:
        input.ownerMemberId,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  }

  async getHousehold(
    householdId: string
  ): Promise<RemoteHousehold | undefined> {
    return this.store.getHousehold(
      householdId
    );
  }

  async listHouseholds():
    Promise<RemoteHousehold[]> {
    return this.store.listHouseholds();
  }

  async listMemberships(
    householdId: string
  ): Promise<HouseholdMembership[]> {
    return this.store.listMemberships(
      householdId
    );
  }

  async inviteMember(
    input: InviteHouseholdMemberInput
  ): Promise<HouseholdInvitation> {
    const user =
      this.store.getCurrentUser();

    if (!user) {
      throw new Error(
        "Sign in before inviting household members."
      );
    }

    const now = new Date();
    const invitation:
      HouseholdInvitation = {
      id:
        createId("invitation"),
      householdId:
        input.householdId,
      email:
        input.email,
      role:
        input.role,
      invitedByUserId:
        user.id,
      status:
        "pending",
      expiresAt:
        new Date(
          now.getTime() +
            7 *
              24 *
              60 *
              60 *
              1000
        ),
      createdAt: now,
      updatedAt: now,
    };

    return this.store.saveInvitation(
      invitation
    );
  }

  async updateMembershipRole(
    input: UpdateMembershipRoleInput
  ): Promise<HouseholdMembership> {
    const membership =
      this.store
        .listMemberships(
          input.householdId
        )
        .find(
          (candidate) =>
            candidate.id ===
            input.membershipId
        );

    if (!membership) {
      throw new Error(
        "Membership was not found."
      );
    }

    return this.store.saveMembership({
      ...membership,
      role:
        input.role,
      updatedAt:
        new Date(),
    });
  }

  async removeMembership(
    householdId: string,
    membershipId: string
  ): Promise<void> {
    const membership =
      this.store
        .listMemberships(
          householdId
        )
        .find(
          (candidate) =>
            candidate.id ===
            membershipId
        );

    if (!membership) {
      return;
    }

    this.store.saveMembership({
      ...membership,
      status: "removed",
      removedAt:
        new Date(),
      updatedAt:
        new Date(),
    });
  }
}
