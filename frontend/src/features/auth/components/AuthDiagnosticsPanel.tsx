import "./AuthDiagnosticsPanel.css";

import {
  useState,
} from "react";
import type {
  FormEvent,
} from "react";

import {
  RotateCw,
} from "lucide-react";

import {
  useAuthDiagnostics,
  useAuthSession,
} from "../hooks";
import {
  loadHousehold,
} from "../../household/services/householdStorage";
import {
  getApplicationDataHealthSummary,
} from "../../startup/services/applicationBackup";
import HouseholdClaimPanel from "./HouseholdClaimPanel";
import MigrationCheckpointPanel from "./MigrationCheckpointPanel";

export default function AuthDiagnosticsPanel() {
  const {
    diagnostics,
    error,
    refreshDiagnostics,
  } = useAuthDiagnostics();
  const {
    session,
    signIn,
    signOut,
    error: sessionError,
  } = useAuthSession();

  const household =
    loadHousehold();

  const healthSummary =
    household
      ? getApplicationDataHealthSummary()
      : null;
  const authenticatedLink =
    household?.authenticatedLink;
  const [
    supabaseEmail,
    setSupabaseEmail,
  ] = useState("");
  const [
    supabaseSignInMessage,
    setSupabaseSignInMessage,
  ] = useState("");

  const handleSignIn =
    async (): Promise<void> => {
      await signIn();
      await refreshDiagnostics();
    };

  const handleSupabaseSignIn =
    async (
      event: FormEvent
    ): Promise<void> => {
      event.preventDefault();
      setSupabaseSignInMessage("");

      try {
        await signIn({
          email:
            supabaseEmail,
          redirectTo:
            window.location.origin +
            window.location.pathname,
        });
        setSupabaseSignInMessage(
          "Magic link requested. Check the disposable-project mailbox."
        );
      } catch {
        setSupabaseSignInMessage(
          "Magic link request failed."
        );
      } finally {
        await refreshDiagnostics();
      }
    };

  const handleSignOut =
    async (): Promise<void> => {
      await signOut();
      await refreshDiagnostics();
    };

  return (
    <div className="auth-diagnostics">
      <div className="auth-diagnostics__header">
        <div>
          <h2>
            Auth Diagnostics
          </h2>

          <p>
            Feature-flagged prototype auth status for this browser session.
          </p>
        </div>

        <button
          type="button"
          className="auth-diagnostics__refresh"
          onClick={() => {
            void refreshDiagnostics();
          }}
          aria-label="Refresh auth diagnostics"
          title="Refresh auth diagnostics"
        >
          <RotateCw
            size={17}
            aria-hidden="true"
          />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="auth-diagnostics__error"
        >
          {error}
        </div>
      )}

      {sessionError && (
        <div
          role="alert"
          className="auth-diagnostics__error"
        >
          {sessionError}
        </div>
      )}

      {diagnostics && (
        <>
          <dl className="auth-diagnostics__grid">
            <div>
              <dt>Auth</dt>
              <dd>
                {diagnostics.enabled
                  ? "Enabled"
                  : "Disabled"}
              </dd>
            </div>

            <div>
              <dt>Provider</dt>
              <dd>
                {diagnostics.provider}
              </dd>
            </div>

            <div>
              <dt>Session</dt>
              <dd>
                {
                  diagnostics.sessionStatus
                }
              </dd>
            </div>

            <div>
              <dt>Adapter</dt>
              <dd>
                {diagnostics.adapterType}
              </dd>
            </div>

            {diagnostics.isSupabaseAdapter && (
              <div>
                <dt>Supabase config</dt>
                <dd>
                  {diagnostics.isSupabaseConfigured
                    ? "configured"
                    : "missing env"}
                </dd>
              </div>
            )}

            <div>
              <dt>Memberships</dt>
              <dd>
                {
                  diagnostics.membershipCount
                }
              </dd>
            </div>

            <div>
              <dt>Invitations</dt>
              <dd>
                {
                  diagnostics.invitationCount
                }
              </dd>
            </div>

            <div>
              <dt>Migrations</dt>
              <dd>
                {
                  diagnostics.migrationDraftCount
                }
              </dd>
            </div>

            <div>
              <dt>Latest migration</dt>
              <dd>
                {diagnostics.latestMigrationStatus ??
                  "none"}
              </dd>
            </div>

            <div>
              <dt>Local link</dt>
              <dd>
                {authenticatedLink
                  ? "linked"
                  : "unlinked"}
              </dd>
            </div>

            <div>
              <dt>Remote household</dt>
              <dd>
                {authenticatedLink
                  ?.remoteHouseholdId ??
                  "none"}
              </dd>
            </div>
          </dl>

          {diagnostics.isPrototypeAdapter && (
            <div className="auth-diagnostics__actions">
              <button
                type="button"
                onClick={() => {
                  void handleSignIn();
                }}
                disabled={
                  session.status ===
                  "signed-in"
                }
              >
                Sign in prototype
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleSignOut();
                }}
                disabled={
                  session.status !==
                  "signed-in"
                }
              >
                Sign out prototype
              </button>
            </div>
          )}

          {diagnostics.isSupabaseAdapter && (
            <form
              className="auth-diagnostics__supabase-form"
              onSubmit={(event) => {
                void handleSupabaseSignIn(
                  event
                );
              }}
            >
              <label htmlFor="supabase-email">
                Supabase email
              </label>
              <div className="auth-diagnostics__supabase-row">
                <input
                  id="supabase-email"
                  type="email"
                  value={supabaseEmail}
                  onChange={(event) => {
                    setSupabaseEmail(
                      event.target.value
                    );
                  }}
                  disabled={
                    !diagnostics.isSupabaseConfigured ||
                    session.status ===
                      "loading"
                  }
                  required
                />
                <button
                  type="submit"
                  disabled={
                    !diagnostics.isSupabaseConfigured ||
                    session.status ===
                      "loading"
                  }
                >
                  Send magic link
                </button>
              </div>
              {supabaseSignInMessage && (
                <p>
                  {supabaseSignInMessage}
                </p>
              )}
            </form>
          )}

          {diagnostics.memberships.length >
            0 && (
            <section className="auth-diagnostics__memberships">
              <h3>
                Memberships
              </h3>
              <div className="auth-diagnostics__membership-list">
                {diagnostics.memberships.map(
                  (membership) => (
                    <dl
                      key={`${membership.householdId}:${membership.memberId}`}
                    >
                      <div>
                        <dt>
                          Household
                        </dt>
                        <dd>
                          {membership.householdName ??
                            membership.householdId}
                        </dd>
                      </div>
                      <div>
                        <dt>
                          Member
                        </dt>
                        <dd>
                          {membership.memberId}
                        </dd>
                      </div>
                      <div>
                        <dt>
                          Role
                        </dt>
                        <dd>
                          {membership.role}
                        </dd>
                      </div>
                      <div>
                        <dt>
                          Status
                        </dt>
                        <dd>
                          {membership.status}
                        </dd>
                      </div>
                    </dl>
                  )
                )}
              </div>
            </section>
          )}
        </>
      )}

      {session.status === "signed-in" &&
        household &&
        healthSummary &&
        !authenticatedLink &&
        (diagnostics?.membershipCount ??
          0) === 0 && (
          <HouseholdClaimPanel
            household={household}
            backupSummary={{
              householdName:
                healthSummary.householdName,
              exportedAt: new Date()
                .toISOString(),
              backupVersion: 1,
              storageSchemaVersion:
                healthSummary.storageSchemaVersion,
              themePreference:
                healthSummary.themePreference,
              accountCount:
                healthSummary.accountCount,
              transactionCount:
                healthSummary.transactionCount,
              expenseAllocationCount:
                healthSummary.expenseAllocationCount,
              settlementCount:
                healthSummary.settlementCount,
              settlementApplicationCount:
                healthSummary.settlementApplicationCount,
              savingsGoalCount:
                healthSummary.savingsGoalCount,
              savingsActivityCount:
                healthSummary.savingsActivityCount,
              providerBillCount:
                healthSummary.providerBillCount,
              passwordProtected: false,
            }}
            onClaimSuccess={() => {
              void refreshDiagnostics();
            }}
            onClaimError={(error) => {
              console.error(
                "Household claim error:",
                error
              );
            }}
          />
        )}

      {session.status === "signed-in" && (
        <MigrationCheckpointPanel
          refreshToken={
            diagnostics?.migrationDraftCount ??
            0
          }
          onStatusChange={() => {
            void refreshDiagnostics();
          }}
        />
      )}
    </div>
  );
}
