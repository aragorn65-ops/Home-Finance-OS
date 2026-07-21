import type {
  AuthHouseholdRole,
  AuthSession,
  AuthUser,
  HouseholdInvitation,
  HouseholdMembership,
  RemoteHousehold,
  RemoteMigrationDraft,
  RemoteMigrationStatus,
} from "../models";

interface InMemoryAuthState {
  currentUser?: AuthUser;
  households: RemoteHousehold[];
  memberships: HouseholdMembership[];
  invitations: HouseholdInvitation[];
  migrations: RemoteMigrationDraft[];
}

export interface InMemoryAuthSeed {
  user?: AuthUser;
  households?: RemoteHousehold[];
  memberships?: HouseholdMembership[];
  invitations?: HouseholdInvitation[];
  migrations?: RemoteMigrationDraft[];
}

export class InMemoryAuthStore {
  private state:
    InMemoryAuthState;

  constructor(
    seed: InMemoryAuthSeed = {}
  ) {
    this.state = {
      currentUser:
        seed.user,
      households:
        seed.households ?? [],
      memberships:
        seed.memberships ?? [],
      invitations:
        seed.invitations ?? [],
      migrations:
        seed.migrations ?? [],
    };
  }

  getSession(): AuthSession {
    if (!this.state.currentUser) {
      return {
        status: "signed-out",
      };
    }

    return {
      status: "signed-in",
      user:
        this.state.currentUser,
    };
  }

  signIn(user?: AuthUser): AuthSession {
    this.state.currentUser =
      user ?? createPrototypeUser();

    return this.getSession();
  }

  signOut(): void {
    this.state.currentUser =
      undefined;
  }

  getCurrentUser():
    AuthUser | undefined {
    return this.state.currentUser;
  }

  listHouseholds():
    RemoteHousehold[] {
    return [
      ...this.state.households,
    ];
  }

  getHousehold(
    householdId: string
  ): RemoteHousehold | undefined {
    return this.state.households.find(
      (household) =>
        household.id === householdId
    );
  }

  saveHousehold(
    household: RemoteHousehold
  ): RemoteHousehold {
    const index =
      this.state.households.findIndex(
        (existing) =>
          existing.id ===
          household.id
      );

    if (index >= 0) {
      this.state.households[
        index
      ] = household;

      return household;
    }

    this.state.households.push(
      household
    );

    return household;
  }

  listMemberships(
    householdId?: string
  ): HouseholdMembership[] {
    return this.state.memberships.filter(
      (membership) =>
        !householdId ||
        membership.householdId ===
          householdId
    );
  }

  saveMembership(
    membership: HouseholdMembership
  ): HouseholdMembership {
    const index =
      this.state.memberships.findIndex(
        (existing) =>
          existing.id ===
          membership.id
      );

    if (index >= 0) {
      this.state.memberships[
        index
      ] = membership;

      return membership;
    }

    this.state.memberships.push(
      membership
    );

    return membership;
  }

  listInvitations():
    HouseholdInvitation[] {
    return [
      ...this.state.invitations,
    ];
  }

  listMigrations():
    RemoteMigrationDraft[] {
    return [
      ...this.state.migrations,
    ];
  }

  saveInvitation(
    invitation: HouseholdInvitation
  ): HouseholdInvitation {
    this.state.invitations.push(
      invitation
    );

    return invitation;
  }

  saveMigration(
    migration: RemoteMigrationDraft
  ): RemoteMigrationDraft {
    const index =
      this.state.migrations.findIndex(
        (existing) =>
          existing.id ===
          migration.id
      );

    if (index >= 0) {
      this.state.migrations[
        index
      ] = migration;

      return migration;
    }

    this.state.migrations.push(
      migration
    );

    return migration;
  }

  getMigration(
    draftId: string
  ): RemoteMigrationDraft | undefined {
    return this.state.migrations.find(
      (migration) =>
        migration.id === draftId
    );
  }

  updateMigrationStatus(
    draftId: string,
    status: RemoteMigrationStatus
  ): RemoteMigrationDraft | undefined {
    const migration =
      this.getMigration(draftId);

    if (!migration) {
      return undefined;
    }

    return this.saveMigration({
      ...migration,
      status,
      updatedAt:
        new Date(),
    });
  }
}

export function createMembership({
  householdId,
  userId,
  memberId,
  role,
}: {
  householdId: string;
  userId: string;
  memberId: string;
  role: AuthHouseholdRole;
}): HouseholdMembership {
  const now = new Date();

  return {
    id:
      createId("membership"),
    householdId,
    userId,
    memberId,
    role,
    status: "active",
    acceptedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export function createId(
  prefix: string
): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createPrototypeUser():
  AuthUser {
  const now = new Date();

  return {
    id:
      createId("user"),
    email:
      "prototype@hfos.local",
    displayName:
      "Prototype User",
    createdAt: now,
    updatedAt: now,
  };
}
