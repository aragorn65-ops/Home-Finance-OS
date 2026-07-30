import type {
  AuthBackendAdapter,
  HouseholdClaimDraft,
  HouseholdClaimResult,
  RemoteHouseholdPreferencesInput,
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

    return this.store.saveHousehold({
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
        "edit-household"
      )
    ) {
      throw new Error(
        "Only a household admin can load core finance records."
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

    return this.store.saveCoreSnapshot({
      householdId:
        input.householdId,
      accounts:
        input.accounts,
      transactions:
        input.transactions,
      savedAt:
        new Date(),
    });
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
      isActive:
        input.settlement.isActive,
      updatedAt: now,
      updatedByUserId:
        user?.id,
    };

    this.store.saveSettlement(
      settlement
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
}
