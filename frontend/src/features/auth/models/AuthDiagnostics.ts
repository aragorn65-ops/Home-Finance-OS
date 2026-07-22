import type {
  AuthProvider,
} from "../../../config/auth";
import type {
  AuthSessionStatus,
} from "./AuthSession";

export interface AuthMembershipDiagnostic {
  householdId: string;
  householdName?: string;
  memberId: string;
  role: string;
  status: string;
}

export interface AuthAccountDiagnosticSummary {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  householdVisibleCount: number;
  privateVisibleCount: number;
  assetCount: number;
  liabilityCount: number;
  currencies: string[];
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
  accountSummary?:
    AuthAccountDiagnosticSummary;
  invitationCount: number;
  migrationDraftCount: number;
  latestMigrationStatus?: string;
}
