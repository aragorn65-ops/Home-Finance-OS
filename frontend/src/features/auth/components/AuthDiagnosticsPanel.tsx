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
import {
  formatMigrationCheckpointDate,
} from "./migrationCheckpointLifecycle";

function formatReadinessStatus(
  status: string
): string {
  if (status === "pass") {
    return "Pass";
  }

  if (status === "blocked") {
    return "Blocked";
  }

  return "Action needed";
}

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Unknown error";
}

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
          "Magic link requested. Check your email inbox."
        );
      } catch (error) {
        setSupabaseSignInMessage(
          `Magic link request failed: ${getErrorMessage(error)}`
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
          {diagnostics.warnings.length >
            0 && (
            <div
              role="status"
              className="auth-diagnostics__warnings"
            >
              {diagnostics.warnings.map(
                (warning) => (
                  <p key={warning}>
                    {warning}
                  </p>
                )
              )}
            </div>
          )}

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
              <dt>Latest migration at</dt>
              <dd>
                {diagnostics.latestMigrationAt
                  ? formatMigrationCheckpointDate(
                    diagnostics.latestMigrationAt
                  )
                  : "none"}
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

          <section className="auth-diagnostics__readiness">
            <div>
              <h3>
                Production Auth Baseline
              </h3>
              <p>
                Sprint 86 checks before migration or sync is enabled.
              </p>
            </div>

            <div className="auth-diagnostics__readiness-list">
              {diagnostics.productionReadinessChecks.map(
                (check) => (
                  <article
                    key={check.id}
                    className="auth-diagnostics__readiness-item"
                    data-status={
                      check.status
                    }
                  >
                    <div>
                      <h4>
                        {check.label}
                      </h4>
                      <p>
                        {check.detail}
                      </p>
                    </div>
                    <span>
                      {formatReadinessStatus(
                        check.status
                      )}
                    </span>
                  </article>
                )
              )}
            </div>
          </section>

          {diagnostics.schemaReadinessChecks.length >
            0 && (
            <section className="auth-diagnostics__readiness">
              <div>
                <h3>
                  Cloud Schema Readiness
                </h3>
                <p>
                  Sprint 88 checks before upload or sync paths are enabled.
                </p>
              </div>

              <div className="auth-diagnostics__readiness-list">
                {diagnostics.schemaReadinessChecks.map(
                  (check) => (
                    <article
                      key={check.id}
                      className="auth-diagnostics__readiness-item"
                      data-status={
                        check.status
                      }
                    >
                      <div>
                        <h4>
                          {check.label}
                        </h4>
                        <p>
                          {check.detail}
                        </p>
                      </div>
                      <span>
                        {formatReadinessStatus(
                          check.status
                        )}
                      </span>
                    </article>
                  )
                )}
              </div>
            </section>
          )}

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

          {diagnostics.accountSummary && (
            <section className="auth-diagnostics__account-summary">
              <h3>
                Account Visibility
              </h3>
              <dl>
                <div>
                  <dt>Total</dt>
                  <dd>
                    {diagnostics.accountSummary.totalCount}
                  </dd>
                </div>
                <div>
                  <dt>Active</dt>
                  <dd>
                    {diagnostics.accountSummary.activeCount}
                  </dd>
                </div>
                <div>
                  <dt>Private</dt>
                  <dd>
                    {diagnostics.accountSummary.privateVisibleCount}
                  </dd>
                </div>
                <div>
                  <dt>Household</dt>
                  <dd>
                    {diagnostics.accountSummary.householdVisibleCount}
                  </dd>
                </div>
                <div>
                  <dt>Assets</dt>
                  <dd>
                    {diagnostics.accountSummary.assetCount}
                  </dd>
                </div>
                <div>
                  <dt>Liabilities</dt>
                  <dd>
                    {diagnostics.accountSummary.liabilityCount}
                  </dd>
                </div>
                <div>
                  <dt>Currencies</dt>
                  <dd>
                    {diagnostics.accountSummary.currencies.join(", ") ||
                      "none"}
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {diagnostics.transactionSummary && (
            <section className="auth-diagnostics__transaction-summary">
              <h3>
                Transaction Visibility
              </h3>
              <dl>
                <div>
                  <dt>Total</dt>
                  <dd>
                    {diagnostics.transactionSummary.totalCount}
                  </dd>
                </div>
                <div>
                  <dt>Active</dt>
                  <dd>
                    {diagnostics.transactionSummary.activeCount}
                  </dd>
                </div>
                <div>
                  <dt>Income</dt>
                  <dd>
                    {diagnostics.transactionSummary.incomeCount}
                  </dd>
                </div>
                <div>
                  <dt>Expenses</dt>
                  <dd>
                    {diagnostics.transactionSummary.expenseCount}
                  </dd>
                </div>
                <div>
                  <dt>Transfers</dt>
                  <dd>
                    {diagnostics.transactionSummary.transferCount}
                  </dd>
                </div>
                <div>
                  <dt>Private</dt>
                  <dd>
                    {diagnostics.transactionSummary.privateVisibleCount}
                  </dd>
                </div>
                <div>
                  <dt>Participants</dt>
                  <dd>
                    {diagnostics.transactionSummary.participantVisibleCount}
                  </dd>
                </div>
                <div>
                  <dt>Household</dt>
                  <dd>
                    {diagnostics.transactionSummary.householdVisibleCount}
                  </dd>
                </div>
                <div>
                  <dt>Source links</dt>
                  <dd>
                    {diagnostics.transactionSummary.sourceAccountLinkedCount}
                  </dd>
                </div>
                <div>
                  <dt>Destination links</dt>
                  <dd>
                    {diagnostics.transactionSummary.destinationAccountLinkedCount}
                  </dd>
                </div>
                <div>
                  <dt>No account link</dt>
                  <dd>
                    {diagnostics.transactionSummary.missingAccountLinkCount}
                  </dd>
                </div>
                <div>
                  <dt>Expenses without source</dt>
                  <dd>
                    {diagnostics.transactionSummary.expenseMissingSourceAccountCount}
                  </dd>
                </div>
                <div>
                  <dt>Date Range</dt>
                  <dd>
                    {diagnostics.transactionSummary.earliestTransactionDate &&
                    diagnostics.transactionSummary.latestTransactionDate
                      ? `${diagnostics.transactionSummary.earliestTransactionDate} to ${diagnostics.transactionSummary.latestTransactionDate}`
                      : "none"}
                  </dd>
                </div>
              </dl>
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
