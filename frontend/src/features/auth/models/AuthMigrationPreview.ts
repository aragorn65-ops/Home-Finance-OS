import type {
  ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";

export type AuthMigrationPreviewStatus =
  | "ready"
  | "needs-backup"
  | "invalid"
  | "blocked";

export interface AuthMigrationPreview {
  status: AuthMigrationPreviewStatus;
  householdId?: string;
  householdName: string;
  summary: ApplicationBackupSummary;
  ownerMemberId?: string;
  linkedUserId?: string;
  warnings: string[];
  blockers: string[];
}
