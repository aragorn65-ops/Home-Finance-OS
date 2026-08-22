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

  const membership =
    useMemo(
      () => {
        const scopedMembership =
          memberships[0];

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
          [...allActiveMemberships].sort(
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
        allActiveMemberships,
        memberships,
      ]
    );

  return {
    session,
    membership,
    memberships,
    allActiveMemberships,
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
