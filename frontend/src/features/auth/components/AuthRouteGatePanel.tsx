import {
  LogIn,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import type {
  AuthRouteAccessResult,
} from "../services";

interface AuthRouteGatePanelProps {
  access: AuthRouteAccessResult;
  sessionLabel: string;
  roleLabel?: string;
  error?: string;
  isSignInAvailable?: boolean;
  signInLabel?: string;
  onSignIn?: () => void;
  onRefresh?: () => void;
}

export default function AuthRouteGatePanel({
  access,
  sessionLabel,
  roleLabel,
  error,
  isSignInAvailable = false,
  signInLabel = "Sign in",
  onSignIn,
  onRefresh,
}: AuthRouteGatePanelProps) {
  return (
    <section className="app-auth-gate">
      <div className="app-auth-gate__icon">
        <ShieldAlert
          size={24}
          aria-hidden="true"
        />
      </div>

      <div className="app-auth-gate__content">
        <p className="app-auth-gate__eyebrow">
          Public beta access check
        </p>

        <h1>
          {access.title ??
            "Access Required"}
        </h1>

        <p>
          {access.message ??
            "HFOS could not load this route until access is confirmed."}
        </p>

        <dl className="app-auth-gate__status">
          <div>
            <dt>Session</dt>
            <dd>{sessionLabel}</dd>
          </div>

          <div>
            <dt>Role</dt>
            <dd>
              {roleLabel ?? "Not confirmed"}
            </dd>
          </div>

          <div>
            <dt>Route</dt>
            <dd>{access.status}</dd>
          </div>
        </dl>

        {error && (
          <p className="app-auth-gate__error">
            {error}
          </p>
        )}

        <div className="app-auth-gate__actions">
          {isSignInAvailable && (
            <button
              type="button"
              onClick={onSignIn}
            >
              <LogIn
                size={17}
                aria-hidden="true"
              />
              {signInLabel}
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
            >
              <RefreshCw
                size={17}
                aria-hidden="true"
              />
              Refresh
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
