import type {
  HouseholdMember,
} from "../../household/models/HouseholdMember";
import type {
  AuthBackendAdapter,
  AuthSessionSubscription,
  HouseholdClaimDraft,
  HouseholdClaimResult,
  InviteLinkedHouseholdMemberRequest,
  RemoteHouseholdPreferencesInput,
  UpdateRemoteHouseholdMemberProfileRequest,
} from "./AuthBackendAdapter";
import {
  createMembership,
  createId,
  InMemoryAuthStore,
  type InMemoryAuthSeed,
} from "./inMemoryAuthStore";
import {
  canAccessHousehold,
  canAccessSettlementRecord,
} from "./authorization";
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
  RemoteHousehold,
  RemoteHouseholdCoreSnapshot,
  RemoteHouseholdCoreSnapshotInput,
  RemoteMigrationAccountUploadPayload,
  RemoteMigrationAccountUploadStagingResult,
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationPreCommitAudit,
  RemoteMigrationTransactionUploadPayload,
  RemoteMigrationTransactionUploadStagingResult,
  RemoteMigrationUploadManifest,
  RemoteMigrationUploadStagingResult,
  RemoteMigrationValidation,
  RemoteSettlement,
  RemoteSettlementApplication,
  RemoteSettlementCreateInput,
  RemoteSettlementMutationResult,
  RemoteSettlementUpdateInput,
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

  private readonly coreSnapshotListeners =
    new Map<
      string,
      Set<() => void>
    >();

  private readonly settlementListeners =
    new Map<
      string,
      Set<() => void>
    >();

  private readonly householdPreferenceListeners =
    new Map<
      string,
      Set<() => void>
    >();

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

  async inviteLinkedHouseholdMember(
    request: InviteLinkedHouseholdMemberRequest
  ): Promise<HouseholdMembership> {
    const currentUser =
      this.store.getCurrentUser();

    if (!currentUser) {
      throw new Error(
        "Sign in before inviting household members."
      );
    }

    await this.tenantRepository.inviteMember({
      householdId:
        request.householdId,
      email:
        request.email,
      role:
        request.role,
    });

    return this.store.saveMembership(
      createMembership({
        householdId:
          request.householdId,
        userId:
          createId("user"),
        memberId:
          request.localMemberId,
        memberDisplayName:
          request.displayName,
        role:
          request.role,
      })
    );
  }

  async updateRemoteHouseholdMemberProfile(
    request: UpdateRemoteHouseholdMemberProfileRequest
  ): Promise<HouseholdMember> {
    const currentMembership =
      this.getActiveMembership(
        request.householdId
      );

    if (
      currentMembership?.role !== "owner" &&
      currentMembership?.role !== "admin" &&
      currentMembership?.memberId !==
        request.localMemberId
    ) {
      throw new Error(
        "Members can update only their own household member profile."
      );
    }

    const canManageMemberAccess =
      currentMembership?.role ===
        "owner" ||
      currentMembership?.role ===
        "admin";

    const memberships =
      this.store
        .listMemberships(
          request.householdId
        )
        .map((membership) =>
          membership.memberId ===
          request.localMemberId
            ? {
                ...membership,
                memberDisplayName:
                  request.displayName,
                updatedAt:
                  new Date(),
              }
            : membership
        );

    const updatedMembership =
      memberships.find(
        (membership) =>
          membership.memberId ===
          request.localMemberId
      );

    if (!updatedMembership) {
      throw new Error(
        "Remote household member was not found."
      );
    }

    this.store.saveMembership(
      updatedMembership
    );

    const now =
      new Date();
    const requestedRole =
      canManageMemberAccess &&
      (
        request.role === "owner" ||
        request.role === "admin"
      )
        ? request.role
        : undefined;
    const storedRole =
      updatedMembership.role ===
        "owner" ||
      updatedMembership.role ===
        "admin"
        ? updatedMembership.role
        : "member";

    return {
      id:
        updatedMembership.memberId,
      householdId:
        updatedMembership.householdId,
      userId:
        updatedMembership.userId,
      displayName:
        updatedMembership.memberDisplayName ??
        request.displayName,
      role:
        requestedRole ?? storedRole,
      color:
        request.color,
      isActive:
        canManageMemberAccess
          ? request.isActive ??
            (updatedMembership.status ===
              "active")
          : updatedMembership.status ===
            "active",
      createdAt:
        updatedMembership.createdAt ?? now,
      updatedAt:
        updatedMembership.updatedAt ?? now,
    };
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
          memberDisplayName:
            draft.ownerDisplayName,
          role: "owner",
        })
      );

    const migrationDraft =
      await this.migrationRepository
        .createDraft({
          ...draft,
          claimedHouseholdId:
            household.id,
        });

    return {
      householdId:
        household.id,
      membership,
      migrationDraft,
    };
  }

  async listMigrationDrafts():
    Promise<RemoteMigrationDraft[]> {
    return this.migrationRepository
      .listDrafts();
  }

  async validateMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationValidation> {
    return this.migrationRepository
      .validateDraft(draftId);
  }

  async stageMigrationUploadManifest(
    draftId: string,
    manifest: RemoteMigrationUploadManifest
  ): Promise<RemoteMigrationUploadStagingResult> {
    return this.migrationRepository
      .stageUploadManifest(
        draftId,
        manifest
      );
  }

  async stageMigrationAccounts(
    draftId: string,
    payload: RemoteMigrationAccountUploadPayload
  ): Promise<RemoteMigrationAccountUploadStagingResult> {
    return this.migrationRepository
      .stageAccounts(
        draftId,
        payload
      );
  }

  async stageMigrationTransactions(
    draftId: string,
    payload: RemoteMigrationTransactionUploadPayload
  ): Promise<RemoteMigrationTransactionUploadStagingResult> {
    return this.migrationRepository
      .stageTransactions(
        draftId,
        payload
      );
  }

  async auditMigrationPreCommit(
    draftId: string
  ): Promise<RemoteMigrationPreCommitAudit> {
    const selectedDraft =
      (
        await this.migrationRepository
          .listDrafts()
      ).find(
        (migrationDraft) =>
          migrationDraft.id === draftId
      );
    const blockers: string[] = [];

    if (!selectedDraft) {
      blockers.push(
        "Migration draft was not found."
      );
    } else {
      if (!selectedDraft.uploadStagedAt) {
        blockers.push(
          "Stage the migration upload manifest before commit audit."
        );
      }

      if (!selectedDraft.accountUploadStagedAt) {
        blockers.push(
          "Stage migration accounts before commit audit."
        );
      }

      if (!selectedDraft.transactionUploadStagedAt) {
        blockers.push(
          "Stage migration transactions before commit audit."
        );
      }
    }

    return {
      draftId,
      isReady:
        blockers.length === 0,
      blockerCount:
        blockers.length,
      warningCount:
        0,
      blockers,
      warnings: [],
      accountCount:
        selectedDraft?.backupSummary
          .accountCount ?? 0,
      transactionCount:
        selectedDraft?.backupSummary
          .transactionCount ?? 0,
      missingExpenseSourceAccountCount:
        0,
      missingTransactionAccountLinkCount:
        0,
      auditedAt:
        new Date(),
    };
  }

  async loadRemoteHousehold(
    householdId: string
  ): Promise<RemoteHousehold> {
    const household =
      this.store.getHousehold(
        householdId
      );

    if (!household) {
      throw new Error(
        "Remote household was not found."
      );
    }

    const context =
      this.createAuthorizationContext(
        householdId
      );

    if (
      !canAccessHousehold(
        context,
        householdId,
        "view-household"
      )
    ) {
      throw new Error(
        "Active household membership is required to load household preferences."
      );
    }

    return household;
  }

  async listRemoteHouseholdMembers(
    householdId: string
  ): Promise<HouseholdMember[]> {
    const now = new Date();

    return this.store
      .listMemberships(householdId)
      .map((membership) => ({
        id:
          membership.memberId,
        householdId:
          membership.householdId,
        userId:
          membership.userId,
        displayName:
          membership.memberDisplayName ??
          membership.memberId,
        role:
          membership.role === "owner" ||
          membership.role === "admin"
            ? membership.role
            : "member",
        isActive:
          membership.status === "active",
        createdAt:
          membership.createdAt ?? now,
        updatedAt:
          membership.updatedAt ?? now,
      }));
  }

  async saveRemoteHouseholdPreferences(
    input: RemoteHouseholdPreferencesInput
  ): Promise<RemoteHousehold> {
    const household =
      this.store.getHousehold(
        input.householdId
      );

    if (!household) {
      throw new Error(
        "Remote household was not found."
      );
    }

    const context =
      this.createAuthorizationContext(
        input.householdId
      );

    if (
      !canAccessHousehold(
        context,
        input.householdId,
        "edit-household"
      )
    ) {
      throw new Error(
        "Only a household admin can save household preferences."
      );
    }

    const savedHousehold =
      this.store.saveHousehold({
        ...household,
        name:
          input.name,
        country:
          input.country,
        currency:
          input.currency,
        timezone:
          input.timezone,
        updatedAt:
          new Date(),
      });

    this.notifyHouseholdPreferenceListeners(
      input.householdId
    );

    return savedHousehold;
  }

  subscribeToHouseholdPreferenceChanges(
    householdId: string,
    onChange: () => void
  ): AuthSessionSubscription {
    return this.subscribeToHouseholdChange(
      this.householdPreferenceListeners,
      householdId,
      onChange
    );
  }

  async commitMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult> {
    return this.migrationRepository
      .commitDraft(draftId);
  }

  async abortMigrationDraft(
    draftId: string
  ): Promise<void> {
    return this.migrationRepository
      .abortDraft(draftId);
  }

  async loadRemoteCoreSnapshot(
    householdId: string
  ): Promise<RemoteHouseholdCoreSnapshot> {
    const context =
      this.createAuthorizationContext(
        householdId
      );

    if (
      !canAccessHousehold(
        context,
        householdId,
        "view-household"
      )
    ) {
      throw new Error(
        "Active household membership is required to load core finance records."
      );
    }

    return this.store.getCoreSnapshot(
      householdId
    );
  }

  async saveRemoteCoreSnapshot(
    input: RemoteHouseholdCoreSnapshotInput
  ): Promise<RemoteHouseholdCoreSnapshot> {
    const context =
      this.createAuthorizationContext(
        input.householdId
      );

    if (
      !canAccessHousehold(
        context,
        input.householdId,
        "edit-household"
      )
    ) {
      throw new Error(
        "Only a household admin can save core finance records."
      );
    }

    const snapshot =
      this.store.saveCoreSnapshot({
      householdId:
        input.householdId,
      accounts:
        input.accounts,
      transactions:
        input.transactions,
      expenseAllocations:
        input.expenseAllocations,
      providerBills:
        input.providerBills ?? [],
      savedAt:
        new Date(),
    });

    this.notifyCoreSnapshotListeners(
      input.householdId
    );

    return snapshot;
  }

  subscribeToCoreSnapshotChanges(
    householdId: string,
    onChange: () => void
  ): AuthSessionSubscription {
    if (!householdId) {
      return createNoopSubscription();
    }

    const listeners =
      this.coreSnapshotListeners
        .get(householdId) ??
      new Set<() => void>();

    listeners.add(onChange);
    this.coreSnapshotListeners.set(
      householdId,
      listeners
    );

    return {
      unsubscribe: () => {
        listeners.delete(onChange);

        if (listeners.size === 0) {
          this.coreSnapshotListeners
            .delete(householdId);
        }
      },
    };
  }

  async listRemoteSettlements(
    householdId: string
  ): Promise<RemoteSettlement[]> {
    const membership =
      this.getActiveMembership(
        householdId
      );

    if (!membership) {
      return [];
    }

    const context =
      this.createAuthorizationContext(
        householdId
      );

    return this.store
      .listSettlements(householdId)
      .filter((settlement) =>
        canAccessSettlementRecord(
          context,
          settlement,
          "view"
        )
      );
  }

  async listRemoteSettlementApplications(
    householdId: string
  ): Promise<RemoteSettlementApplication[]> {
    const membership =
      this.getActiveMembership(
        householdId
      );

    if (!membership) {
      return [];
    }

    const visibleSettlementIds =
      new Set(
        (
          await this.listRemoteSettlements(
            householdId
          )
        ).map(
          (settlement) =>
            settlement.id
        )
      );

    return this.store
      .listSettlements(householdId)
      .flatMap((settlement) =>
        visibleSettlementIds.has(
          settlement.id
        )
          ? this.store
              .listSettlementApplications(
                settlement.id
              )
          : []
      );
  }

  async createRemoteSettlement(
    input: RemoteSettlementCreateInput
  ): Promise<RemoteSettlementMutationResult> {
    const context =
      this.createAuthorizationContext(
        input.settlement.householdId
      );

    if (
      !canAccessSettlementRecord(
        context,
        input.settlement,
        "create"
      )
    ) {
      throw new Error(
        "Current user cannot create this settlement."
      );
    }

    const now = new Date();
    const user =
      this.store.getCurrentUser();
    const settlement:
      RemoteSettlement = {
      id:
        createId("settlement"),
      householdId:
        input.settlement.householdId,
      localRecordId:
        input.settlement.localRecordId,
      fromMemberId:
        input.settlement.fromMemberId,
      toMemberId:
        input.settlement.toMemberId,
      amount:
        input.settlement.amount,
      settlementDate:
        new Date(
          `${input.settlement.settlementDate}T00:00:00`
        ),
      sourceAccountId:
        input.settlement.sourceAccountId,
      destinationAccountId:
        input.settlement
          .destinationAccountId,
      applicationMethod:
        input.settlement
          .applicationMethod,
      referenceNumber:
        input.settlement.referenceNumber,
      notes:
        input.settlement.notes,
      attachments:
        (
          input.settlement.attachments ??
          []
        ).map((attachment) => ({
          ...attachment,
          createdAt: new Date(
            attachment.createdAt
          ),
        })),
      isActive:
        input.settlement.isActive,
      createdAt: now,
      updatedAt: now,
      updatedByUserId:
        user?.id,
    };

    this.store.saveSettlement(
      settlement
    );
    this.notifySettlementListeners(
      settlement.householdId
    );

    const applications =
      this.createRemoteSettlementApplications(
        settlement,
        input.applications ?? [],
        now,
        user?.id
      );

    return {
      settlement,
      applications:
        this.store
          .replaceSettlementApplications(
            settlement.id,
            applications
          ),
    };
  }

  async updateRemoteSettlement(
    input: RemoteSettlementUpdateInput
  ): Promise<RemoteSettlementMutationResult> {
    const existing =
      this.store.getSettlement(
        input.settlementId
      );

    if (!existing) {
      throw new Error(
        "Remote settlement was not found."
      );
    }

    const context =
      this.createAuthorizationContext(
        existing.householdId
      );

    if (
      !canAccessSettlementRecord(
        context,
        existing,
        "update"
      )
    ) {
      throw new Error(
        "Current user cannot update this settlement."
      );
    }

    const now = new Date();
    const user =
      this.store.getCurrentUser();
    const settlement:
      RemoteSettlement = {
      ...existing,
      householdId:
        existing.householdId,
      localRecordId:
        input.settlement.localRecordId,
      fromMemberId:
        input.settlement.fromMemberId,
      toMemberId:
        input.settlement.toMemberId,
      amount:
        input.settlement.amount,
      settlementDate:
        new Date(
          `${input.settlement.settlementDate}T00:00:00`
        ),
      sourceAccountId:
        input.settlement.sourceAccountId,
      destinationAccountId:
        input.settlement
          .destinationAccountId,
      applicationMethod:
        input.settlement
          .applicationMethod,
      referenceNumber:
        input.settlement.referenceNumber,
      notes:
        input.settlement.notes,
      attachments:
        (
          input.settlement.attachments ??
          []
        ).map((attachment) => ({
          ...attachment,
          createdAt: new Date(
            attachment.createdAt
          ),
        })),
      isActive:
        input.settlement.isActive,
      updatedAt: now,
      updatedByUserId:
        user?.id,
    };

    this.store.saveSettlement(
      settlement
    );
    this.notifySettlementListeners(
      settlement.householdId
    );

    const applications =
      this.createRemoteSettlementApplications(
        settlement,
        input.applications ?? [],
        now,
        user?.id
      );

    return {
      settlement,
      applications:
        this.store
          .replaceSettlementApplications(
            settlement.id,
            applications
          ),
    };
  }

  async deleteRemoteSettlement(
    householdId: string,
    settlementId: string
  ): Promise<void> {
    const existing =
      this.store.getSettlement(
        settlementId
      );

    if (!existing) {
      return;
    }

    const context =
      this.createAuthorizationContext(
        householdId
      );

    if (
      !canAccessSettlementRecord(
        context,
        existing,
        "delete"
      )
    ) {
      throw new Error(
        "Current user cannot delete this settlement."
      );
    }

    this.store.deleteSettlement(
      householdId,
      settlementId
    );
    this.notifySettlementListeners(
      householdId
    );
  }

  subscribeToSettlementChanges(
    householdId: string,
    onChange: () => void
  ): AuthSessionSubscription {
    return this.subscribeToHouseholdChange(
      this.settlementListeners,
      householdId,
      onChange
    );
  }

  private createAuthorizationContext(
    householdId: string
  ) {
    const user =
      this.store.getCurrentUser();
    const membership =
      user
        ? this.getActiveMembership(
            householdId
          )
        : undefined;

    return {
      userId:
        user?.id,
      memberId:
        membership?.memberId,
      membership,
    };
  }

  private getActiveMembership(
    householdId: string
  ) {
    const user =
      this.store.getCurrentUser();

    if (!user) {
      return undefined;
    }

    return this.store
      .listMemberships(householdId)
      .find(
        (membership) =>
          membership.userId ===
            user.id &&
          membership.status ===
            "active"
      );
  }

  private createRemoteSettlementApplications(
    settlement: RemoteSettlement,
    applications: Array<{
      localRecordId?: string;
      expenseAllocationId: string;
      appliedAmount: number;
    }>,
    now: Date,
    userId?: string
  ): RemoteSettlementApplication[] {
    return applications.map(
      (application) => ({
        id:
          createId(
            "settlement-application"
          ),
        householdId:
          settlement.householdId,
        localRecordId:
          application.localRecordId,
        settlementId:
          settlement.id,
        expenseAllocationId:
          application
            .expenseAllocationId,
        appliedAmount:
          application.appliedAmount,
        createdAt: now,
        updatedAt: now,
        updatedByUserId:
          userId,
      })
    );
  }

  private notifyCoreSnapshotListeners(
    householdId: string
  ): void {
    this.coreSnapshotListeners
      .get(householdId)
      ?.forEach((listener) => {
        listener();
      });
  }

  private notifySettlementListeners(
    householdId: string
  ): void {
    this.notifyHouseholdChangeListeners(
      this.settlementListeners,
      householdId
    );
  }

  private notifyHouseholdPreferenceListeners(
    householdId: string
  ): void {
    this.notifyHouseholdChangeListeners(
      this.householdPreferenceListeners,
      householdId
    );
  }

  private subscribeToHouseholdChange(
    listenersByHouseholdId: Map<
      string,
      Set<() => void>
    >,
    householdId: string,
    onChange: () => void
  ): AuthSessionSubscription {
    if (!householdId) {
      return createNoopSubscription();
    }

    const listeners =
      listenersByHouseholdId
        .get(householdId) ??
      new Set<() => void>();

    listeners.add(onChange);
    listenersByHouseholdId.set(
      householdId,
      listeners
    );

    return {
      unsubscribe: () => {
        listeners.delete(onChange);

        if (listeners.size === 0) {
          listenersByHouseholdId
            .delete(householdId);
        }
      },
    };
  }

  private notifyHouseholdChangeListeners(
    listenersByHouseholdId: Map<
      string,
      Set<() => void>
    >,
    householdId: string
  ): void {
    listenersByHouseholdId
      .get(householdId)
      ?.forEach((listener) => {
        listener();
      });
  }
}

function createNoopSubscription():
  AuthSessionSubscription {
  return {
    unsubscribe() {
      return undefined;
    },
  };
}
