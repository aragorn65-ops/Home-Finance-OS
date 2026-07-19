import "./AuthDiagnosticsPanel.css";

import {
  RotateCw,
} from "lucide-react";

import {
  useAuthDiagnostics,
} from "../hooks";

export default function AuthDiagnosticsPanel() {
  const {
    diagnostics,
    error,
    refreshDiagnostics,
  } = useAuthDiagnostics();

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

      {diagnostics && (
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
            <dd>{diagnostics.provider}</dd>
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
              {diagnostics.membershipCount}
            </dd>
          </div>

          <div>
            <dt>Invitations</dt>
            <dd>
              {diagnostics.invitationCount}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
