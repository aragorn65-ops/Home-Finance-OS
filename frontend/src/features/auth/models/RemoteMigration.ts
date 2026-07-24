import type {
  ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";
import type {
  Account,
} from "../../accounts/models/Account";
import type {
  Transaction,
} from "../../transactions/models/Transaction";

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
  accountUploadStagedAt?: Date;
  accountUploadStagedCount?: number;
  transactionUploadStagedAt?: Date;
  transactionUploadStagedCount?: number;
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

export interface RemoteMigrationAccountUploadRecord
  extends Omit<
    Account,
    | "householdId"
    | "ownerMemberId"
    | "paymentDueDate"
    | "exchangeRateEffectiveDate"
    | "createdAt"
    | "updatedAt"
  > {
  paymentDueDate?: string;
  exchangeRateEffectiveDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RemoteMigrationAccountUploadPayload {
  expectedAccountCount: number;
  accounts: RemoteMigrationAccountUploadRecord[];
}

export interface RemoteMigrationAccountUploadStagingResult {
  draftId: string;
  stagedAccountCount: number;
  stagedAt: Date;
}

export interface RemoteMigrationTransactionUploadRecord
  extends Omit<
    Transaction,
    | "householdId"
    | "createdByMemberId"
    | "paidByMemberId"
    | "transactionDate"
    | "exchangeRateEffectiveDate"
    | "createdAt"
    | "updatedAt"
  > {
  transactionDate: string;
  exchangeRateEffectiveDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RemoteMigrationTransactionUploadPayload {
  expectedTransactionCount: number;
  transactions: RemoteMigrationTransactionUploadRecord[];
}

export interface RemoteMigrationTransactionUploadStagingResult {
  draftId: string;
  stagedTransactionCount: number;
  stagedAt: Date;
}

export interface RemoteMigrationPreCommitAudit {
  draftId: string;
  isReady: boolean;
  blockerCount: number;
  warningCount: number;
  blockers: string[];
  warnings: string[];
  accountCount: number;
  transactionCount: number;
  missingExpenseSourceAccountCount: number;
  missingTransactionAccountLinkCount: number;
  auditedAt: Date;
}
