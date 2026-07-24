import type {
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationUploadManifest,
  RemoteMigrationUploadStagingResult,
  RemoteMigrationValidation,
} from "../models";
import type {
  HouseholdClaimDraft,
} from "./AuthBackendAdapter";

export interface RemoteMigrationRepository {
  listDrafts():
    Promise<RemoteMigrationDraft[]>;

  createDraft(
    draft: HouseholdClaimDraft
  ): Promise<RemoteMigrationDraft>;

  validateDraft(
    draftId: string
  ): Promise<RemoteMigrationValidation>;

  stageUploadManifest(
    draftId: string,
    manifest: RemoteMigrationUploadManifest
  ): Promise<RemoteMigrationUploadStagingResult>;

  commitDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult>;

  abortDraft(
    draftId: string
  ): Promise<void>;
}
