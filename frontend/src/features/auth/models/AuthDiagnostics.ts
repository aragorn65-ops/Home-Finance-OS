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

export interface AuthTransactionDiagnosticSummary {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  incomeCount: number;
  expenseCount: number;
  transferCount: number;
  householdVisibleCount: number;
  participantVisibleCount: number;
  privateVisibleCount: number;
  earliestTransactionDate?: string;
  latestTransactionDate?: string;
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
  warnings: string[];
  membershipCount: number;
  memberships:
    AuthMembershipDiagnostic[];
  accountSummary?:
    AuthAccountDiagnosticSummary;
  transactionSummary?:
    AuthTransactionDiagnosticSummary;
  invitationCount: number;
  migrationDraftCount: number;
  latestMigrationStatus?: string;
}
