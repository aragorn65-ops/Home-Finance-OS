import type {
  AuthHouseholdRole,
  AuthSession,
  AuthUser,
  HouseholdInvitation,
  HouseholdMembership,
  RemoteHouseholdCoreSnapshot,
  RemoteSettlement,
  RemoteSettlementApplication,
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
  coreSnapshots:
    RemoteHouseholdCoreSnapshot[];
  settlements: RemoteSettlement[];
  settlementApplications:
    RemoteSettlementApplication[];
}

export interface InMemoryAuthSeed {
  user?: AuthUser;
  households?: RemoteHousehold[];
  memberships?: HouseholdMembership[];
  invitations?: HouseholdInvitation[];
  migrations?: RemoteMigrationDraft[];
  coreSnapshots?:
    RemoteHouseholdCoreSnapshot[];
  settlements?: RemoteSettlement[];
  settlementApplications?:
    RemoteSettlementApplication[];
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
      coreSnapshots:
        seed.coreSnapshots ?? [],
      settlements:
        seed.settlements ?? [],
      settlementApplications:
        seed.settlementApplications ??
        [],
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

  getCoreSnapshot(
    householdId: string
  ): RemoteHouseholdCoreSnapshot {
    const snapshot =
      this.state.coreSnapshots.find(
        (candidate) =>
          candidate.householdId ===
          householdId
      );

    return snapshot
      ? cloneCoreSnapshot(
          snapshot
        )
      : {
          householdId,
          accounts: [],
          transactions: [],
          expenseAllocations: [],
        };
  }

  saveCoreSnapshot(
    snapshot: RemoteHouseholdCoreSnapshot
  ): RemoteHouseholdCoreSnapshot {
    const storedSnapshot =
      cloneCoreSnapshot(
        snapshot
      );
    const index =
      this.state.coreSnapshots
        .findIndex(
          (existing) =>
            existing.householdId ===
            snapshot.householdId
        );

    if (index >= 0) {
      this.state.coreSnapshots[
        index
      ] = storedSnapshot;

      return cloneCoreSnapshot(
        storedSnapshot
      );
    }

    this.state.coreSnapshots.push(
      storedSnapshot
    );

    return cloneCoreSnapshot(
      storedSnapshot
    );
  }

  listSettlements(
    householdId: string
  ): RemoteSettlement[] {
    return this.state.settlements.filter(
      (settlement) =>
        settlement.householdId ===
        householdId
    );
  }

  getSettlement(
    settlementId: string
  ): RemoteSettlement | undefined {
    return this.state.settlements.find(
      (settlement) =>
        settlement.id === settlementId
    );
  }

  saveSettlement(
    settlement: RemoteSettlement
  ): RemoteSettlement {
    const index =
      this.state.settlements.findIndex(
        (existing) =>
          existing.id ===
          settlement.id
      );

    if (index >= 0) {
      this.state.settlements[
        index
      ] = settlement;

      return settlement;
    }

    this.state.settlements.push(
      settlement
    );

    return settlement;
  }

  deleteSettlement(
    householdId: string,
    settlementId: string
  ): void {
    this.state.settlements =
      this.state.settlements.filter(
        (settlement) =>
          settlement.householdId !==
            householdId ||
          settlement.id !==
            settlementId
      );

    this.state.settlementApplications =
      this.state
        .settlementApplications
        .filter(
          (application) =>
            application.householdId !==
              householdId ||
            application.settlementId !==
              settlementId
        );
  }

  listSettlementApplications(
    settlementId: string
  ): RemoteSettlementApplication[] {
    return this.state
      .settlementApplications
      .filter(
        (application) =>
          application.settlementId ===
          settlementId
      );
  }

  replaceSettlementApplications(
    settlementId: string,
    applications:
      RemoteSettlementApplication[]
  ): RemoteSettlementApplication[] {
    this.state.settlementApplications =
      this.state
        .settlementApplications
        .filter(
          (application) =>
            application.settlementId !==
            settlementId
        );

    this.state
      .settlementApplications
      .push(...applications);

    return [
      ...applications,
    ];
  }
}

function cloneCoreSnapshot(
  snapshot: RemoteHouseholdCoreSnapshot
): RemoteHouseholdCoreSnapshot {
  return {
    householdId:
      snapshot.householdId,
    accounts:
      snapshot.accounts.map(
        (account) => ({
          ...account,
        })
      ),
    transactions:
      snapshot.transactions.map(
        (transaction) => ({
          ...transaction,
          attachments:
            transaction.attachments?.map(
              (attachment) => ({
                ...attachment,
              })
            ),
        })
      ),
    expenseAllocations:
      (snapshot.expenseAllocations ?? []).map(
        (allocation) => ({
          ...allocation,
          personalItems:
            allocation.personalItems?.map(
              (item) => ({
                ...item,
              })
            ),
        })
      ),
    savedAt:
      snapshot.savedAt
        ? new Date(
            snapshot.savedAt
          )
        : undefined,
  };
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
