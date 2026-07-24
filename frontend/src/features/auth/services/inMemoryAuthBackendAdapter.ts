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
}
