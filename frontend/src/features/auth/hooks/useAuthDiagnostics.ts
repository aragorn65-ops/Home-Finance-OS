import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  AuthDiagnostics,
} from "../models";
import {
  createAuthDiagnostics,
} from "../services";

export function useAuthDiagnostics() {
  const [
    diagnostics,
    setDiagnostics,
  ] = useState<
    AuthDiagnostics | undefined
  >();
  const [
    error,
    setError,
  ] = useState("");

  const refreshDiagnostics =
    useCallback(async () => {
      setError("");

      try {
        setDiagnostics(
          await createAuthDiagnostics()
        );
      } catch {
        setDiagnostics(undefined);
        setError(
          "Auth diagnostics could not be loaded."
        );
      }
    }, []);

  useEffect(() => {
    void refreshDiagnostics();
  }, [refreshDiagnostics]);

  return {
    diagnostics,
    error,
    refreshDiagnostics,
  };
}
