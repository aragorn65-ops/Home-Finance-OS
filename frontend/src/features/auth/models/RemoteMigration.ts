import type {
  ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";

export type RemoteMigrationStatus =
  | "draft"
  | "uploaded"
  | "validated"
  | "committed"
  | "aborted";

export interface RemoteMigrationDraft {
  id: string;
  householdId: string;
  householdName: string;
  ownerMemberId: string;
  requestedByUserId: string;
  backupSummary: ApplicationBackupSummary;
  remoteRecordCount: number;
  status: RemoteMigrationStatus;
  createdAt: Date;
  updatedAt: Date;
  validatedAt?: Date;
  uploadStagedAt?: Date;
  uploadStagedRecordCount?: number;
  committedAt?: Date;
  abortedAt?: Date;
}

export interface RemoteMigrationValidation {
  draftId: string;
  isValid: boolean;
  recordCountsMatch: boolean;
  warnings: string[];
  blockers: string[];
}

export interface RemoteMigrationCommitResult {
  householdId: string;
  migrationId: string;
  committedAt: Date;
}

export interface RemoteMigrationUploadManifestCount {
  id: string;
  label: string;
  count: number;
}

export interface RemoteMigrationUploadManifest {
  expectedRecordCount: number;
  counts: RemoteMigrationUploadManifestCount[];
}

export interface RemoteMigrationUploadStagingResult {
  draftId: string;
  stagedRecordCount: number;
  stagedAt: Date;
}
