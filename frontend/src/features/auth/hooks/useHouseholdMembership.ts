import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  HouseholdMembership,
} from "../models";
import {
  getAuthBackendAdapter,
} from "../services/createAuthBackendAdapter";

import {
  useAuthSession,
} from "./useAuthSession";
import { getSessionMemberships } from "../services/sessionMemberships";

export function useHouseholdMembership(
  householdId: string
) {
  const {
    session,
    error: sessionError,
    refreshSession,
    signIn,
    signOut,
  } = useAuthSession();

  const [
    memberships,
    setMemberships,
  ] = useState<
    HouseholdMembership[]
  >([]);
  const [
    allActiveMemberships,
    setAllActiveMemberships,
  ] = useState<
    HouseholdMembership[]
  >([]);

  const [error, setError] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  useEffect(() => {
    let isActive = true;

    if (
      session.status !==
        "signed-in"
    ) {
      setMemberships([]);
      setAllActiveMemberships([]);
      setError("");
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setError("");
    setIsLoading(true);

    void getAuthBackendAdapter()
      .listMemberships()
      .then((nextMemberships) => {
        if (!isActive) {
          return;
        }

        const activeMemberships =
          nextMemberships.filter(
            (membership) =>
              membership.status ===
              "active"
          );

        setAllActiveMemberships(
          activeMemberships
        );
        setMemberships(
          activeMemberships.filter(
            (membership) =>
              !householdId ||
              membership.householdId ===
                householdId
          )
        );
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setMemberships([]);
        setAllActiveMemberships([]);
        setIsLoading(false);
        setError(
          "Household membership could not be loaded."
        );
      });

    return () => {
      isActive = false;
    };
  }, [
    householdId,
    session.status,
    session.user?.id,
  ]);

  const currentMemberships = useMemo(
    () => getSessionMemberships(memberships, session, householdId),
    [memberships, session, householdId]
  );
  const currentActiveMemberships = useMemo(
    () => getSessionMemberships(allActiveMemberships, session),
    [allActiveMemberships, session]
  );

  const membership =
    useMemo(
      () => {
        const scopedMembership =
          currentMemberships[0];

        if (
          scopedMembership &&
          (
            scopedMembership.role ===
              "owner" ||
            scopedMembership.role ===
              "admin"
          )
        ) {
          return scopedMembership;
        }

        const newestMembership =
          [...currentActiveMemberships].sort(
            (
              left,
              right
            ) =>
              getMembershipTime(right) -
              getMembershipTime(left)
          )[0];

        return (
          newestMembership ??
          scopedMembership
        );
      },
      [
        currentActiveMemberships,
        currentMemberships,
      ]
    );

  return {
    session,
    membership,
    memberships: currentMemberships,
    allActiveMemberships: currentActiveMemberships,
    error:
      sessionError || error,
    isLoading,
    refreshSession,
    signIn,
    signOut,
  };
}

function getMembershipTime(
  membership: HouseholdMembership
): number {
  return (
    membership.acceptedAt ??
    membership.invitedAt ??
    membership.updatedAt ??
    membership.createdAt
  ).getTime();
}
