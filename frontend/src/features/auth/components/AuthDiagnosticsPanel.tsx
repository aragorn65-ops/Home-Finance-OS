import "./AuthDiagnosticsPanel.css";

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

  const handleSignIn =
    async (): Promise<void> => {
      await signIn();
      await refreshDiagnostics();
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
                {diagnostics.isPrototypeAdapter
                  ? "Prototype"
                  : "Disabled"}
              </dd>
            </div>

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
        </>
      )}

      {session.status === "signed-in" &&
        household &&
        healthSummary && (
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
    </div>
  );
}
