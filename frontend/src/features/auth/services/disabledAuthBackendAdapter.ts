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
} from "../models";

export class DisabledAuthBackendAdapter
  implements AuthBackendAdapter
{
  async getSession(): Promise<AuthSession> {
    return {
      status: "disabled",
    };
  }

  async signIn(): Promise<AuthSession> {
    return {
      status: "disabled",
    };
  }

  async signOut(): Promise<void> {
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
      `Authenticated household migration is disabled for ${draft.householdName}.`
    );
  }
}
