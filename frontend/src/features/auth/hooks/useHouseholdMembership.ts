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

  const [error, setError] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  useEffect(() => {
    let isActive = true;

    if (
      session.status !==
        "signed-in" ||
      !householdId
    ) {
      setMemberships([]);
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

        setMemberships(
          nextMemberships.filter(
            (membership) =>
              membership.householdId ===
                householdId &&
              membership.status ===
                "active"
          )
        );
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setMemberships([]);
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
      () => memberships[0],
      [memberships]
    );

  return {
    session,
    membership,
    memberships,
    error:
      sessionError || error,
    isLoading,
    refreshSession,
    signIn,
    signOut,
  };
}
