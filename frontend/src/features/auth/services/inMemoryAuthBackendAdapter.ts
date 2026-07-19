import type {
  AuthBackendAdapter,
  HouseholdClaimDraft,
  HouseholdClaimResult,
} from "./AuthBackendAdapter";
import {
  createMembership,
  InMemoryAuthStore,
  type InMemoryAuthSeed,
} from "./inMemoryAuthStore";
import {
  InMemoryRemoteMigrationRepository,
} from "./inMemoryRemoteMigrationRepository";
import {
  InMemoryRemoteTenantRepository,
} from "./inMemoryRemoteTenantRepository";
import type {
  AuthSession,
  AuthUser,
  HouseholdInvitation,
  HouseholdMembership,
} from "../models";

export class InMemoryAuthBackendAdapter
  implements AuthBackendAdapter
{
  readonly tenantRepository:
    InMemoryRemoteTenantRepository;

  readonly migrationRepository:
    InMemoryRemoteMigrationRepository;

  private readonly store:
    InMemoryAuthStore;

  constructor(
    seed: InMemoryAuthSeed = {}
  ) {
    this.store =
      new InMemoryAuthStore(seed);
    this.tenantRepository =
      new InMemoryRemoteTenantRepository(
        this.store
      );
    this.migrationRepository =
      new InMemoryRemoteMigrationRepository(
        this.store
      );
  }

  async getSession():
    Promise<AuthSession> {
    return this.store.getSession();
  }

  async signIn():
    Promise<AuthSession> {
    return this.store.signIn();
  }

  async signOut():
    Promise<void> {
    this.store.signOut();
  }

  async getCurrentUser():
    Promise<AuthUser | undefined> {
    return this.store.getCurrentUser();
  }

  async listMemberships():
    Promise<HouseholdMembership[]> {
    return this.store.listMemberships();
  }

  async listInvitations():
    Promise<HouseholdInvitation[]> {
    return this.store.listInvitations();
  }

  async createHouseholdClaimDraft(
    draft: HouseholdClaimDraft
  ): Promise<HouseholdClaimResult> {
    const session =
      this.store.getSession();

    if (
      session.status !==
        "signed-in" ||
      !session.user
    ) {
      throw new Error(
        "Sign in before claiming a household."
      );
    }

    const household =
      await this.tenantRepository
        .createHousehold({
          name:
            draft.householdName,
          ownerMemberId:
            draft.ownerMemberId,
        });

    const membership =
      this.store.saveMembership(
        createMembership({
          householdId:
            household.id,
          userId:
            session.user.id,
          memberId:
            draft.ownerMemberId,
          role: "owner",
        })
      );

    await this.migrationRepository
      .createDraft(draft);

    return {
      householdId:
        household.id,
      membership,
    };
  }
}
