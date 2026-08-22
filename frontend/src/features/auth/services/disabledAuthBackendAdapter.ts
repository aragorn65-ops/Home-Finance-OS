import type {
  HouseholdMember,
} from "../../household/models/HouseholdMember";
import type {
  AuthBackendAdapter,
  HouseholdClaimDraft,
  HouseholdClaimResult,
  InviteLinkedHouseholdMemberRequest,
  RemoteHouseholdPreferencesInput,
} from "./AuthBackendAdapter";
import type {
  AuthSession,
  AuthUser,
  HouseholdInvitation,
  HouseholdMembership,
  RemoteHouseholdCoreSnapshot,
  RemoteHouseholdCoreSnapshotInput,
  RemoteHousehold,
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

export class DisabledAuthBackendAdapter
  implements AuthBackendAdapter
{
  async getSession(): Promise<AuthSession> {
    return {
      status: "disabled",
    };
  }

  async signIn(): Promise<AuthSession> {
    return {
      status: "disabled",
    };
  }

  async signOut(): Promise<void> {
    return Promise.resolve();
  }

  async getCurrentUser():
    Promise<AuthUser | undefined> {
    return undefined;
  }

  async listMemberships():
    Promise<HouseholdMembership[]> {
    return [];
  }

  async listInvitations():
    Promise<HouseholdInvitation[]> {
    return [];
  }

  async inviteLinkedHouseholdMember(
    request: InviteLinkedHouseholdMemberRequest
  ): Promise<HouseholdMembership> {
    throw new Error(
      `Remote member invitations are disabled for ${request.email}.`
    );
  }

  async updateRemoteHouseholdMemberProfile(
    request: {
      householdId: string;
      localMemberId: string;
      displayName: string;
    }
  ): Promise<HouseholdMember> {
    void request.displayName;
    throw new Error(
      `Remote member profile updates are disabled for ${request.householdId}.`
    );
  }

  async createHouseholdClaimDraft(
    draft: HouseholdClaimDraft
  ): Promise<HouseholdClaimResult> {
    throw new Error(
      `Authenticated household migration is disabled for ${draft.householdName}.`
    );
  }

  async listMigrationDrafts():
    Promise<RemoteMigrationDraft[]> {
    return [];
  }

  async validateMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationValidation> {
    throw new Error(
      `Remote migration validation is disabled for ${draftId}.`
    );
  }

  async stageMigrationUploadManifest(
    draftId: string,
    manifest: RemoteMigrationUploadManifest
  ): Promise<RemoteMigrationUploadStagingResult> {
    void manifest;
    throw new Error(
      `Remote migration upload staging is disabled for ${draftId}.`
    );
  }

  async loadRemoteHousehold(
    householdId: string
  ): Promise<RemoteHousehold> {
    throw new Error(
      `Remote household persistence is disabled for ${householdId}.`
    );
  }

  async listRemoteHouseholdMembers():
    Promise<HouseholdMember[]> {
    return [];
  }

  async saveRemoteHouseholdPreferences(
    input: RemoteHouseholdPreferencesInput
  ): Promise<RemoteHousehold> {
    throw new Error(
      `Remote household persistence is disabled for ${input.householdId}.`
    );
  }

  async stageMigrationAccounts(
    draftId: string,
    payload: RemoteMigrationAccountUploadPayload
  ): Promise<RemoteMigrationAccountUploadStagingResult> {
    void payload;
    throw new Error(
      `Remote migration account staging is disabled for ${draftId}.`
    );
  }

  async stageMigrationTransactions(
    draftId: string,
    payload: RemoteMigrationTransactionUploadPayload
  ): Promise<RemoteMigrationTransactionUploadStagingResult> {
    void payload;
    throw new Error(
      `Remote migration transaction staging is disabled for ${draftId}.`
    );
  }

  async auditMigrationPreCommit(
    draftId: string
  ): Promise<RemoteMigrationPreCommitAudit> {
    throw new Error(
      `Remote migration pre-commit audit is disabled for ${draftId}.`
    );
  }

  async commitMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult> {
    throw new Error(
      `Remote migration commit is disabled for ${draftId}.`
    );
  }

  async abortMigrationDraft(
    draftId: string
  ):
    Promise<void> {
    throw new Error(
      `Remote migration abort is disabled for ${draftId}.`
    );
  }

  async loadRemoteCoreSnapshot(
    householdId: string
  ): Promise<RemoteHouseholdCoreSnapshot> {
    return {
      householdId,
      accounts: [],
      transactions: [],
      expenseAllocations: [],
    };
  }

  async saveRemoteCoreSnapshot(
    input: RemoteHouseholdCoreSnapshotInput
  ): Promise<RemoteHouseholdCoreSnapshot> {
    throw new Error(
      `Remote core household persistence is disabled for ${input.householdId}.`
    );
  }

  subscribeToCoreSnapshotChanges() {
    return {
      unsubscribe() {
        return undefined;
      },
    };
  }

  subscribeToSettlementChanges() {
    return {
      unsubscribe() {
        return undefined;
      },
    };
  }

  subscribeToHouseholdPreferenceChanges() {
    return {
      unsubscribe() {
        return undefined;
      },
    };
  }

  async listRemoteSettlements(
    householdId: string
  ): Promise<RemoteSettlement[]> {
    void householdId;
    return [];
  }

  async listRemoteSettlementApplications(
    householdId: string
  ): Promise<RemoteSettlementApplication[]> {
    void householdId;
    return [];
  }

  async createRemoteSettlement(
    input: RemoteSettlementCreateInput
  ): Promise<RemoteSettlementMutationResult> {
    throw new Error(
      `Remote settlement creation is disabled for ${input.settlement.householdId}.`
    );
  }

  async updateRemoteSettlement(
    input: RemoteSettlementUpdateInput
  ): Promise<RemoteSettlementMutationResult> {
    throw new Error(
      `Remote settlement update is disabled for ${input.settlementId}.`
    );
  }

  async deleteRemoteSettlement(
    householdId: string,
    settlementId: string
  ): Promise<void> {
    void householdId;
    throw new Error(
      `Remote settlement deletion is disabled for ${settlementId}.`
    );
  }
}
