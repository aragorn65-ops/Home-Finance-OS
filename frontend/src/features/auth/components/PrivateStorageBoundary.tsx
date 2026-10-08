import { useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { isAuthFeatureEnabled } from "../../../config/auth";
import { applicationStorageScope } from "../../../shared/storage/userScopedStorage";
import { applyThemePreference, getStoredThemePreference } from "../../../shared/theme/themePreference";
import { getAuthBackendAdapter } from "../services/createAuthBackendAdapter";
import { prepareIsolatedHousehold } from "../services/prepareIsolatedHousehold";
import type { AuthSessionObserver } from "../services/AuthBackendAdapter";
import type { AuthSession } from "../models";

export default function PrivateStorageBoundary({ children }: { children: ReactNode }) {
  const enabled = isAuthFeatureEnabled();
  const [ready, setReady] = useState(!enabled);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let selected = false;
    let selectedUser: string | null = null;
    let observedSession: AuthSession | undefined;
    const adapter = getAuthBackendAdapter();
    const handleSession = (session?: AuthSession) => {
      if (!active || !session) return;
      observedSession = session;
      const nextUser = session.status === "signed-in" ? session.user?.id ?? null : null;
      if (!selected || nextUser === selectedUser) return;
      // Never mount a new identity over repositories and pending work from the old one.
      applicationStorageScope.lock();
      active = false;
      flushSync(() => setReady(false));
      window.location.reload();
    };
    const subscription = (adapter as AuthSessionObserver).subscribeToSessionChanges?.(handleSession);
    const recheck = () => { void adapter.getSession().then(handleSession).catch(() => undefined); };
    window.addEventListener("hfos-auth-session-changed", recheck);
    window.addEventListener("focus", recheck);

    void adapter.getSession().then(async (session) => {
      if (!active) return;
      const current = observedSession ?? session;
      selectedUser = current.status === "signed-in" ? current.user?.id ?? null : null;
      selected = true;
      applicationStorageScope.select(selectedUser);
      if (selectedUser) await prepareIsolatedHousehold(adapter, selectedUser, () => active);
      if (!active) return;
      applyThemePreference(getStoredThemePreference());
      setReady(true);
    }).catch((failure: unknown) => {
      if (!active) return;
      applicationStorageScope.lock();
      setError(failure instanceof Error ? failure.message : "Private storage could not be opened.");
    });
    return () => {
      active = false;
      subscription?.unsubscribe();
      window.removeEventListener("hfos-auth-session-changed", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, [enabled]);

  if (!ready) return (
    <main className="p-6" aria-busy={!error}>
      <p role={error ? "alert" : "status"}>{error || "Opening your private browser storage..."}</p>
      {error && <button type="button" onClick={() => window.location.reload()}>Retry</button>}
    </main>
  );
  return children;
}
