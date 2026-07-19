import type {
  ApplicationBackupSummary,
} from "../../startup/services/applicationBackup";
import type {
  HouseholdMember,
} from "../../household/models/HouseholdMember";
import type {
  AuthMigrationPreview,
  AuthUser,
} from "../models";

export function createAuthMigrationPreview({
  summary,
  owner,
  user,
}: {
  summary: ApplicationBackupSummary;
  owner?: HouseholdMember;
  user?: AuthUser;
}): AuthMigrationPreview {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!owner) {
    blockers.push(
      "A household owner is required before this household can be claimed."
    );
  }

  if (!user) {
    blockers.push(
      "Sign in before claiming a local household."
    );
  }

  if (summary.passwordProtected) {
    warnings.push(
      "Protected backup passwords remain separate from account passwords."
    );
  }

  return {
    status:
      blockers.length > 0
        ? "blocked"
        : "ready",
    householdName:
      summary.householdName,
    summary,
    ownerMemberId:
      owner?.id,
    linkedUserId:
      user?.id,
    warnings,
    blockers,
  };
}
