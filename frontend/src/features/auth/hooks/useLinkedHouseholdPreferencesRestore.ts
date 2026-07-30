import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  isAuthFeatureEnabled,
} from "../../../config/auth";
import type {
  AuthHouseholdRole,
  AuthSessionStatus,
} from "../models";
import type {
  AuthHouseholdPreferencesObserver,
  LinkedHouseholdPreferencesHousehold,
} from "../services";
import {
  getAuthBackendAdapter,
  restoreLinkedRemoteHouseholdPreferences,
} from "../services";
import {
  browserHouseholdPreferencesLocalWriter,
} from "../services/browserHouseholdPreferencesLocalWriter";

export const householdPreferencesRestoredEvent =
  "hfos-household-preferences-restored";

interface UseLinkedHouseholdPreferencesRestoreOptions {
  household:
    | LinkedHouseholdPreferencesHousehold
    | null;
  sessionStatus: AuthSessionStatus;
  role?: AuthHouseholdRole;
  isRouteAllowed: boolean;
  isSettingsRoute: boolean;
}

export function useLinkedHouseholdPreferencesRestore({
  household,
  sessionStatus,
  role,
  isRouteAllowed,
  isSettingsRoute,
}: UseLinkedHouseholdPreferencesRestoreOptions) {
  const restoredKeys =
    useRef<Set<string>>(
      new Set()
    );

  const [isRestoring, setIsRestoring] =
    useState(false);
  const [error, setError] =
    useState("");
  const [restoreVersion, setRestoreVersion] =
    useState(0);
  const [
    restoreTrigger,
    setRestoreTrigger,
  ] = useState(0);

  const remoteHouseholdId =
    household?.authenticatedLink
      ?.remoteHouseholdId ?? "";
  const localHouseholdId =
    household?.id ?? "";

  const shouldRestore =
    isAuthFeatureEnabled() &&
    isRouteAllowed &&
    !isSettingsRoute &&
    sessionStatus === "signed-in" &&
    (
      role === "owner" ||
      role === "admin"
    ) &&
    Boolean(remoteHouseholdId);

  useEffect(() => {
    if (!shouldRestore) {
      setIsRestoring(false);
      setError("");
      return;
    }

    if (
      !localHouseholdId ||
      !remoteHouseholdId
    ) {
      return;
    }

    const restoreKey = [
      localHouseholdId,
      remoteHouseholdId,
      sessionStatus,
      role,
    ].join(":");

    if (
      restoredKeys.current.has(
        restoreKey
      ) &&
      restoreTrigger === 0
    ) {
      return;
    }

    if (
      restoreTrigger > 0 &&
      !restoredKeys.current.has(
        restoreKey
      )
    ) {
      return;
    }

    let isActive = true;

    setError("");
    setIsRestoring(true);

    void restoreLinkedRemoteHouseholdPreferences({
      authEnabled:
        isAuthFeatureEnabled(),
      household: {
        id:
          localHouseholdId,
        authenticatedLink: {
          remoteHouseholdId,
        },
      },
      adapter:
        getAuthBackendAdapter(),
      writer:
        browserHouseholdPreferencesLocalWriter,
    })
      .then((result) => {
        if (!isActive) {
          return;
        }

        restoredKeys.current.add(
          restoreKey
        );
        setIsRestoring(false);

        if (
          result.status ===
          "restored"
        ) {
          setRestoreVersion(
            (current) =>
              current + 1
          );
          window.dispatchEvent(
            new CustomEvent(
              householdPreferencesRestoredEvent,
              {
                detail: result,
              }
            )
          );
        }
      })
      .catch((restoreError: unknown) => {
        if (!isActive) {
          return;
        }

        setIsRestoring(false);
        setError(
          getErrorMessage(
            restoreError
          )
        );
      });

    return () => {
      isActive = false;
    };
  }, [
    isRouteAllowed,
    isSettingsRoute,
    localHouseholdId,
    remoteHouseholdId,
    restoreTrigger,
    role,
    sessionStatus,
    shouldRestore,
  ]);

  useEffect(() => {
    if (
      !shouldRestore ||
      !remoteHouseholdId
    ) {
      return;
    }

    const adapter =
      getAuthBackendAdapter() as
        AuthHouseholdPreferencesObserver;
    const subscription =
      adapter
        .subscribeToHouseholdPreferenceChanges?.(
          remoteHouseholdId,
          () => {
            setRestoreTrigger(
              (current) =>
                current + 1
            );
          }
        );

    return () => {
      subscription?.unsubscribe();
    };
  }, [
    remoteHouseholdId,
    shouldRestore,
  ]);

  return {
    isRestoring,
    error,
    isRequired:
      shouldRestore,
    restoreVersion,
  };
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

  return "Cloud household preferences could not be loaded.";
}
