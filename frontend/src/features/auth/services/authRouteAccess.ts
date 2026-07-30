import type {
  AuthHouseholdRole,
  AuthSessionStatus,
} from "../models";

export type AuthRouteAccessStatus =
  | "allowed"
  | "loading"
  | "signed-out"
  | "membership-required"
  | "role-blocked";

export interface AuthRouteAccessInput {
  authEnabled: boolean;
  pathname: string;
  sessionStatus: AuthSessionStatus;
  role?: AuthHouseholdRole;
  membershipLoadFailed?: boolean;
}

export interface AuthRouteAccessResult {
  status: AuthRouteAccessStatus;
  isAllowed: boolean;
  title?: string;
  message?: string;
}

const settingsPath =
  "/app/settings";
const settlementPath =
  "/app/settlements";

export function evaluateAuthRouteAccess({
  authEnabled,
  pathname,
  sessionStatus,
  role,
  membershipLoadFailed = false,
}: AuthRouteAccessInput): AuthRouteAccessResult {
  if (!authEnabled) {
    return allow();
  }

  if (sessionStatus === "loading") {
    return {
      status: "loading",
      isAllowed: false,
      title: "Checking Session",
      message:
        "HFOS is confirming the authenticated session before loading household data.",
    };
  }

  if (
    sessionStatus === "disabled"
  ) {
    return allow();
  }

  if (
    sessionStatus !==
    "signed-in"
  ) {
    if (isSettingsPath(pathname)) {
      return allow();
    }

    return {
      status: "signed-out",
      isAllowed: false,
      title: "Sign In Required",
      message:
        "Public beta cloud mode requires sign-in before household finance data can be loaded.",
    };
  }

  if (
    role === "owner" ||
    role === "admin"
  ) {
    return allow();
  }

  if (!role) {
    return {
      status: "membership-required",
      isAllowed: false,
      title: membershipLoadFailed
        ? "Membership Unavailable"
        : "Household Access Required",
      message: membershipLoadFailed
        ? "Household membership could not be loaded for this signed-in session."
        : "Open Settings to refresh Auth Diagnostics and claim or link this household before loading finance pages.",
    };
  }

  if (
    role === "member" &&
    isSettlementPath(pathname)
  ) {
    return allow();
  }

  return {
    status: "role-blocked",
    isAllowed: false,
    title: "Admin Access Required",
    message:
      "This public beta account can only add settlement records for the household.",
  };
}

function allow(): AuthRouteAccessResult {
  return {
    status: "allowed",
    isAllowed: true,
  };
}

function isSettingsPath(
  pathname: string
): boolean {
  return (
    pathname === settingsPath ||
    pathname.startsWith(
      `${settingsPath}/`
    )
  );
}

function isSettlementPath(
  pathname: string
): boolean {
  return (
    pathname === settlementPath ||
    pathname.startsWith(
      `${settlementPath}/`
    )
  );
}
