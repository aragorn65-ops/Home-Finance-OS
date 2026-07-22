import type {
  AuthBackendAdapter,
  HouseholdClaimDraft,
  HouseholdClaimResult,
} from "./AuthBackendAdapter";
import type {
  AuthSession,
  AuthUser,
  HouseholdInvitation,
  HouseholdMembership,
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationValidation,
} from "../models";

export interface SupabaseAuthBackendAdapterConfig {
  projectUrl?: string;
  anonKey?: string;
}

export class SupabaseAuthBackendAdapter
  implements AuthBackendAdapter
{
  private readonly config:
    SupabaseAuthBackendAdapterConfig;

  constructor(
    config:
      SupabaseAuthBackendAdapterConfig =
        createSupabaseAdapterConfig()
  ) {
    this.config = config;
  }

  async getSession():
    Promise<AuthSession> {
    if (!this.hasRequiredConfig()) {
      return {
        status: "disabled",
      };
    }

    return {
      status: "signed-out",
    };
  }

  async signIn():
    Promise<AuthSession> {
    throw new Error(
      this.createUnavailableMessage(
        "sign-in"
      )
    );
  }

  async signOut():
    Promise<void> {
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

  async createHouseholdClaimDraft(
    draft: HouseholdClaimDraft
  ): Promise<HouseholdClaimResult> {
    throw new Error(
      this.createUnavailableMessage(
        `household claim for ${draft.householdName}`
      )
    );
  }

  async listMigrationDrafts():
    Promise<RemoteMigrationDraft[]> {
    return [];
  }

  async validateMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationValidation> {
    return {
      draftId,
      isValid: false,
      recordCountsMatch: false,
      warnings: [],
      blockers: [
        this.createUnavailableMessage(
          "migration validation"
        ),
      ],
    };
  }

  async commitMigrationDraft(
    draftId: string
  ): Promise<RemoteMigrationCommitResult> {
    throw new Error(
      this.createUnavailableMessage(
        `migration commit for ${draftId}`
      )
    );
  }

  async abortMigrationDraft():
    Promise<void> {
    return Promise.resolve();
  }

  private hasRequiredConfig():
    boolean {
    return Boolean(
      this.config.projectUrl &&
        this.config.anonKey
    );
  }

  private createUnavailableMessage(
    action: string
  ): string {
    if (!this.hasRequiredConfig()) {
      return (
        "Supabase auth spike is missing " +
        "VITE_SUPABASE_URL or " +
        "VITE_SUPABASE_ANON_KEY."
      );
    }

    return (
      `Supabase ${action} is not wired yet. ` +
      "Run the disposable-project spike before " +
      "enabling production beta auth."
    );
  }
}

function createSupabaseAdapterConfig():
  SupabaseAuthBackendAdapterConfig {
  const viteEnv =
    import.meta.env as
      | Record<string, string | undefined>
      | undefined;

  return {
    projectUrl:
      viteEnv?.VITE_SUPABASE_URL,
    anonKey:
      viteEnv?.VITE_SUPABASE_ANON_KEY,
  };
}
