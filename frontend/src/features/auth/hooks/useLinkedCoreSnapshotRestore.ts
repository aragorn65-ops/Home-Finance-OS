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
  LinkedCoreSnapshotHousehold,
} from "../services";
import {
  getAuthBackendAdapter,
  restoreLinkedRemoteCoreSnapshot,
} from "../services";
import {
  browserCoreSnapshotLocalWriter,
} from "../services/browserCoreSnapshotLocalWriter";

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

  const shouldRestore =
    isAuthFeatureEnabled() &&
    isRouteAllowed &&
    !isSettingsRoute &&
    sessionStatus === "signed-in" &&
    (
      role === "owner" ||
      role === "admin"
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
      )
    ) {
      return;
    }

    let isActive = true;

    setError("");
    setIsRestoring(true);

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

        setError(
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
    ownerMemberId,
    remoteHouseholdId,
    role,
    sessionStatus,
    shouldRestore,
  ]);

  return {
    isRestoring,
    error,
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
