import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  AuthSessionObserver,
  AuthSignInRequest,
  AuthSession,
} from "../models";
import {
  getAuthBackendAdapter,
} from "../services/createAuthBackendAdapter";

const authSessionChangedEvent =
  "hfos-auth-session-changed";
const authCallbackSignals:
  Array<keyof WindowEventMap> = [
    "hashchange",
    "focus",
  ];

const initialSession:
  AuthSession = {
  status: "loading",
};

export function useAuthSession() {
  const [
    session,
    setSession,
  ] = useState<AuthSession>(
    initialSession
  );

  const [
    error,
    setError,
  ] = useState("");

  const refreshSession =
    useCallback(async () => {
      setError("");

      try {
        const nextSession =
          await getAuthBackendAdapter()
            .getSession();

        setSession(nextSession);
      } catch {
        setSession({
          status: "signed-out",
        });
        setError(
          "Auth session could not be loaded."
        );
      }
    }, []);

  const signIn =
    useCallback(async (
      request?: AuthSignInRequest
    ) => {
      setError("");
      setSession({
        status: "loading",
      });

      try {
        const nextSession =
          await getAuthBackendAdapter()
            .signIn(request);

        setSession(nextSession);
        window.dispatchEvent(
          new Event(
            authSessionChangedEvent
          )
        );
      } catch {
        setSession({
          status: "signed-out",
        });
        setError(
          "Sign in is not available yet."
        );
      }
    }, []);

  const signOut =
    useCallback(async () => {
      setError("");

      try {
        await getAuthBackendAdapter()
          .signOut();
      } catch {
        setError(
          "Sign out could not be completed."
        );
      } finally {
        await refreshSession();
        window.dispatchEvent(
          new Event(
            authSessionChangedEvent
          )
        );
      }
    }, [refreshSession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const adapter =
      getAuthBackendAdapter();
    const handleAuthSessionChanged =
      () => {
        void refreshSession();
      };
    const subscription =
      (
        adapter as
          AuthSessionObserver
      ).subscribeToSessionChanges?.(
        handleAuthSessionChanged
      );

    window.addEventListener(
      authSessionChangedEvent,
      handleAuthSessionChanged
    );
    authCallbackSignals.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          handleAuthSessionChanged
        );
      }
    );

    return () => {
      window.removeEventListener(
        authSessionChangedEvent,
        handleAuthSessionChanged
      );
      authCallbackSignals.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            handleAuthSessionChanged
          );
        }
      );
      subscription?.unsubscribe();
    };
  }, [refreshSession]);

  return {
    session,
    error,
    refreshSession,
    signIn,
    signOut,
  };
}
