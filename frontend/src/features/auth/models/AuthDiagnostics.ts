import type {
  AuthProvider,
} from "../../../config/auth";
import type {
  AuthSessionStatus,
} from "./AuthSession";

export interface AuthDiagnostics {
  enabled: boolean;
  provider: AuthProvider;
  sessionStatus: AuthSessionStatus;
  isPrototypeAdapter: boolean;
  membershipCount: number;
  invitationCount: number;
  migrationDraftCount: number;
  latestMigrationStatus?: string;
}
