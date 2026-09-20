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
  AuthCoreSnapshotObserver,
  LinkedCoreSnapshotHousehold,
} from "../services";
import {
  getAuthBackendAdapter,
  restoreLinkedRemoteCoreSnapshot,
} from "../services";
import {
  browserCoreSnapshotLocalWriter,
} from "../services/browserCoreSnapshotLocalWriter";
import { subscribeToCoreSnapshotRefreshFallback } from "../services/coreSnapshotRefreshFallback";

export const coreSnapshotRestoredEvent =
  "hfos-core-snapshot-restored";

interface UseLinkedCoreSnapshotRestoreOptions {
  household:
    | LinkedCoreSnapshotHousehold
    | null;
  sessionStatus: AuthSessionStatus;
  role?: AuthHouseholdRole;
  isRouteAllowed: boolean;
  isSettingsRoute: boolean;
}

export function useLinkedCoreSnapshotRestore({
  household,
  sessionStatus,
  role,
  isRouteAllowed,
  isSettingsRoute,
}: UseLinkedCoreSnapshotRestoreOptions) {
  const restoredKeys =
    useRef<Set<string>>(
      new Set()
    );

  const [isRestoring, setIsRestoring] =
    useState(false);
  const [error, setError] =
    useState("");
  const [backgroundError, setBackgroundError] = useState("");
  const isFetching = useRef(false);
  const [
    restoreTrigger,
    setRestoreTrigger,
  ] = useState(0);

  const shouldRestore =
    isAuthFeatureEnabled() &&
    isRouteAllowed &&
    !isSettingsRoute &&
    sessionStatus === "signed-in" &&
    (
      role === "owner" ||
      role === "admin" ||
      role === "member" ||
      role === "viewer"
    ) &&
    Boolean(
      household?.authenticatedLink
        ?.remoteHouseholdId
    );

  const localHouseholdId =
    household?.id ?? "";
  const remoteHouseholdId =
    household?.authenticatedLink
      ?.remoteHouseholdId ?? "";
  const ownerMemberId =
    household?.authenticatedLink
      ?.ownerMemberId;

  useEffect(() => {
    if (!shouldRestore) {
      setIsRestoring(false);
      setError("");
      setBackgroundError("");
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

    let isActive = true;
    const isInitialRestore = !restoredKeys.current.has(restoreKey);
    const reportError = isInitialRestore ? setError : setBackgroundError;

    setError("");
    // Background refresh must not unmount the route or discard unsaved forms.
    setIsRestoring(isInitialRestore);
    isFetching.current = true;

    void restoreLinkedRemoteCoreSnapshot({
      authEnabled:
        isAuthFeatureEnabled(),
      household: {
        id:
          localHouseholdId,
        authenticatedLink: {
          remoteHouseholdId,
          ownerMemberId,
        },
      },
      adapter:
        getAuthBackendAdapter(),
      writer:
        browserCoreSnapshotLocalWriter,
      isCurrent: () => isActive,
    })
      .then((result) => {
        if (!isActive) {
          return;
        }

        setIsRestoring(false);
        isFetching.current = false;

        if (
          result.status ===
          "restored"
        ) {
          restoredKeys.current.add(restoreKey);
          setBackgroundError("");
          window.dispatchEvent(
            new CustomEvent(
              coreSnapshotRestoredEvent,
              {
                detail: result,
              }
            )
          );

          return;
        }

        if (result.reason === "superseded-restore") return;

        reportError(
          getSkippedRestoreMessage(
            result.reason
          )
        );
      })
      .catch((restoreError: unknown) => {
        if (!isActive) {
          return;
        }

        setIsRestoring(false);
        isFetching.current = false;
        reportError(
          getErrorMessage(
            restoreError
          )
        );
      });

    return () => {
      isActive = false;
      isFetching.current = false;
    };
  }, [
    isRouteAllowed,
    isSettingsRoute,
    localHouseholdId,
    ownerMemberId,
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
        AuthCoreSnapshotObserver;
    const subscription =
      adapter
        .subscribeToCoreSnapshotChanges?.(
          remoteHouseholdId,
          () => {
            setRestoreTrigger(
              (current) =>
                current + 1
            );
          }
        );
    const stopFallback = subscribeToCoreSnapshotRefreshFallback(
      () => setRestoreTrigger((current) => current + 1),
      () => isFetching.current
    );

    return () => {
      stopFallback();
      subscription?.unsubscribe();
    };
  }, [
    remoteHouseholdId,
    shouldRestore,
  ]);

  return {
    isRestoring,
    error,
    backgroundError,
    isRequired:
      shouldRestore,
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

  return "Cloud core snapshot could not be loaded.";
}

function getSkippedRestoreMessage(
  reason: string
): string {
  if (
    reason === "missing-owner-member"
  ) {
    return "Linked household owner member is missing.";
  }

  return "Linked cloud core snapshot restore was skipped.";
}
