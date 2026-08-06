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
const memberTransparencyPaths = [
  "/app/household-members",
  "/app/transactions",
  "/app/utilities",
  "/app/settlements",
  "/app/savings",
  "/app/analytics",
  "/app/help-center",
];

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
    if (isSettingsPath(pathname)) {
      return allow();
    }

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
    isMemberTransparencyPath(pathname)
  ) {
    return allow();
  }

  if (
    role === "viewer" &&
    (
      isMemberTransparencyPath(pathname) ||
      isSettingsPath(pathname)
    )
  ) {
    return allow();
  }

  return {
    status: "role-blocked",
    isAllowed: false,
    title: "Admin Access Required",
    message:
      "This public beta account can only open member transparency pages for the household.",
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

function isMemberTransparencyPath(
  pathname: string
): boolean {
  return (
    pathname === "/app" ||
    memberTransparencyPaths.some(
      (allowedPath) =>
        pathname === allowedPath ||
        pathname.startsWith(
          `${allowedPath}/`
        )
    ) ||
    isSettingsPath(pathname)
  );
}
