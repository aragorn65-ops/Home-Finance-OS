import type {
  AuthProvider,
} from "../../../config/auth";
import type {
  AuthSessionStatus,
} from "./AuthSession";

export interface AuthMembershipDiagnostic {
  householdId: string;
  memberId: string;
  role: string;
  status: string;
}

export interface AuthDiagnostics {
  enabled: boolean;
  provider: AuthProvider;
  sessionStatus: AuthSessionStatus;
  adapterType:
    | "disabled"
    | "prototype"
    | "supabase";
  isPrototypeAdapter: boolean;
  isSupabaseAdapter: boolean;
  isSupabaseConfigured: boolean;
  membershipCount: number;
  memberships:
    AuthMembershipDiagnostic[];
  invitationCount: number;
  migrationDraftCount: number;
  latestMigrationStatus?: string;
}
