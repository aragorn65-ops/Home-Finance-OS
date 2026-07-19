import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  AuthSession,
} from "../models";
import {
  getAuthBackendAdapter,
} from "../services/createAuthBackendAdapter";

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
    useCallback(async () => {
      setError("");
      setSession({
        status: "loading",
      });

      try {
        const nextSession =
          await getAuthBackendAdapter()
            .signIn();

        setSession(nextSession);
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
      }
    }, [refreshSession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  return {
    session,
    error,
    refreshSession,
    signIn,
    signOut,
  };
}
