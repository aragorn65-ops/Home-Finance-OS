import "./AppShell.css";

import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";

import {
  isAuthFeatureEnabled,
} from "../../config/auth";
import {
  AuthRouteGatePanel,
  getAuthBackendAdapter,
  useHouseholdMembership,
  useLinkedHouseholdPreferencesRestore,
  useLinkedCoreSnapshotRestore,
} from "../../features/auth";
import {
  evaluateAuthRouteAccess,
} from "../../features/auth/services";
import {
  loadHousehold,
  saveLinkedHouseholdShell,
  saveHouseholdMembers,
} from "../../features/household/services/householdStorage";
import { reconcileHouseholdMembers } from "../../features/household/services/reconcileHouseholdMembers";
import AppUnlockScreen from "../../features/security/components/AppUnlockScreen";
import {
  getAppLockIdleTimeoutMinutes,
  isAppLockEnabled,
} from "../../features/security/services/appLockService";

export default function AppShell() {
  const [
    householdBootstrapVersion,
    setHouseholdBootstrapVersion,
  ] = useState(0);
  const household = loadHousehold();
  const [bootstrapError, setBootstrapError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const householdId =
    household?.id ?? "";
  const authHouseholdId =
    household?.authenticatedLink
      ?.remoteHouseholdId ??
    householdId;
  const isCurrentSettingsPath =
    isSettingsPath(
      location.pathname
    );
  const isCurrentSettlementPath =
    isSettlementPath(
      location.pathname
    );
  const isCurrentMemberTransparencyPath =
    isMemberTransparencyPath(
      location.pathname
    );
  const isProductionAuthEnabled =
    isAuthFeatureEnabled();
  const {
    session,
    membership,
    error:
      authError,
    isLoading:
      isMembershipLoading,
    refreshSession,
    signIn,
  } = useHouseholdMembership(
    authHouseholdId
  );
  const linkedRemoteHouseholdId =
    household?.authenticatedLink
      ?.remoteHouseholdId;
  const shouldRepairMemberHouseholdLink =
    Boolean(household) &&
    Boolean(linkedRemoteHouseholdId) &&
    session.status === "signed-in" &&
    membership?.status === "active" &&
    (
      membership.role === "member" ||
      membership.role === "viewer"
    ) &&
    membership.householdId !==
      linkedRemoteHouseholdId;
  const localMembershipMember =
    household?.members.find(
      (member) =>
        member.id ===
        membership?.memberId
    );
  const shouldRepairMemberDisplayName =
    Boolean(
      household &&
      membership?.memberDisplayName &&
      localMembershipMember &&
      localMembershipMember.displayName !==
        membership.memberDisplayName
    );
  const shouldHydrateSparseMemberShell =
    Boolean(
      household &&
      session.status === "signed-in" &&
      membership?.status === "active" &&
      household.members.length === 0
    );
  const shouldRepairMemberHouseholdShell =
    shouldRepairMemberHouseholdLink ||
    shouldRepairMemberDisplayName ||
    shouldHydrateSparseMemberShell;
  const shouldHydrateRemoteMemberProfiles =
    Boolean(
      household &&
      linkedRemoteHouseholdId &&
      session.status === "signed-in" &&
      membership?.status === "active" &&
      household.members.length > 0
    );

  const [memberRefreshVersion, setMemberRefreshVersion] = useState(0);
  useEffect(() => {
    if (!shouldHydrateRemoteMemberProfiles) return;
    const refresh = () => {
      if (document.visibilityState === "visible") setMemberRefreshVersion((value) => value + 1);
    };
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(timer);
    };
  }, [shouldHydrateRemoteMemberProfiles]);

  const [
    isLockEnabled,
    setIsLockEnabled,
  ] = useState(() =>
    isAppLockEnabled()
  );

  const [
    idleTimeoutMinutes,
    setIdleTimeoutMinutes,
  ] = useState(() =>
    getAppLockIdleTimeoutMinutes()
  );

  const [
    isLocked,
    setIsLocked,
  ] = useState(() =>
    isAppLockEnabled()
  );

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);

  useEffect(() => {
    const handleAppLockSettingsChanged =
      () => {
        const nextIsEnabled =
          isAppLockEnabled();

        setIsLockEnabled(
          nextIsEnabled
        );
        setIdleTimeoutMinutes(
          getAppLockIdleTimeoutMinutes()
        );

        if (!nextIsEnabled) {
          setIsLocked(false);
        }
      };

    window.addEventListener(
      "hfos-app-lock-settings-changed",
      handleAppLockSettingsChanged
    );

    return () => {
      window.removeEventListener(
        "hfos-app-lock-settings-changed",
        handleAppLockSettingsChanged
      );
    };
  }, []);

  useEffect(() => {
    if (
      !isLockEnabled ||
      isLocked ||
      idleTimeoutMinutes <= 0
    ) {
      return;
    }

    let timeoutId:
      ReturnType<typeof setTimeout>;

    const lockAfterInactivity = () => {
      setIsSidebarOpen(false);
      setIsLocked(true);
    };

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(
        lockAfterInactivity,
        idleTimeoutMinutes * 60 * 1000
      );
    };

    const activityEvents = [
      "click",
      "keydown",
      "pointerdown",
      "scroll",
      "touchstart",
    ] as const;

    activityEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,
        resetTimer,
        {
          passive: true,
        }
      );
    });

    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);

      activityEvents.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          resetTimer
        );
      });
    };
  }, [
    idleTimeoutMinutes,
    isLockEnabled,
    isLocked,
  ]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isSidebarOpen]);

  const authRouteAccess =
    evaluateAuthRouteAccess({
      authEnabled:
        isProductionAuthEnabled,
      pathname:
        location.pathname,
      sessionStatus:
        session.status,
      role:
        membership?.role,
      membershipLoadFailed:
        Boolean(authError) &&
        !isMembershipLoading,
    });

  const coreSnapshotRestore =
    useLinkedCoreSnapshotRestore({
      household,
      userId: session.user?.id,
      sessionStatus:
        session.status,
      role:
        membership?.role,
      isRouteAllowed:
        authRouteAccess.isAllowed && !shouldRepairMemberHouseholdShell,
      isSettingsRoute:
        isCurrentSettingsPath,
    });
  const householdPreferencesRestore =
    useLinkedHouseholdPreferencesRestore({
      household,
      sessionStatus:
        session.status,
      role:
        membership?.role,
      isRouteAllowed:
        authRouteAccess.isAllowed && !shouldRepairMemberHouseholdShell,
      isSettingsRoute:
        isCurrentSettingsPath,
    });

  useEffect(() => {
    if (
      (
        household &&
        !shouldRepairMemberHouseholdShell
      ) ||
      !isProductionAuthEnabled ||
      !authRouteAccess.isAllowed ||
      (
        isCurrentSettingsPath &&
        !shouldRepairMemberHouseholdShell
      ) ||
      session.status !== "signed-in" ||
      !session.user ||
      !membership ||
      membership.status !== "active" ||
      !["owner", "admin", "member", "viewer"].includes(membership.role)
    ) {
      return;
    }

    let isActive = true;
    setBootstrapError("");
    const signedInUser =
      session.user;

    const adapter =
      getAuthBackendAdapter();

    void adapter
      .loadRemoteHousehold(
        membership.householdId
      )
      .then(async (remoteHousehold) => {
        if (!isActive) {
          return;
        }

        const now =
          new Date();
        const remoteMembers =
          await adapter.listRemoteHouseholdMembers(
            membership.householdId
          );
        if (!isActive) return;
        if (!remoteMembers.length) {
          throw new Error("No household member profiles were returned. Existing browser records were preserved.");
        }
        const currentMember =
          remoteMembers.find(
            (member) =>
              member.id ===
              membership.memberId
          );
        const saved =
          saveLinkedHouseholdShell({
            id:
              remoteHousehold.id,
            remoteHouseholdId:
              remoteHousehold.id,
            householdName:
              remoteHousehold.name,
            country:
              remoteHousehold.country ?? "",
            currency:
              remoteHousehold.currency ?? "",
            timezone:
              remoteHousehold.timezone ?? "",
            ownerMemberId:
              remoteMembers.find((member) => member.role === "owner")?.id ?? membership.memberId,
            linkedByUserId:
              signedInUser.id,
            member: {
              id:
                membership.memberId,
              householdId:
                remoteHousehold.id,
              userId:
                signedInUser.id,
              displayName:
                currentMember?.displayName ??
                membership.memberDisplayName ??
                signedInUser.displayName ??
                signedInUser.email ??
                "You",
              role:
                membership.role ===
                "viewer"
                  ? "member"
                  : membership.role,
              isActive: true,
              createdAt:
                membership.createdAt ??
                now,
              updatedAt:
                membership.updatedAt ??
                now,
            },
            members:
              remoteMembers.length > 0
                ? remoteMembers
                : undefined,
            replaceExisting:
              shouldRepairMemberHouseholdShell,
          });

        if (saved) {
          setHouseholdBootstrapVersion(
            (current) =>
              current + 1
          );
        } else {
          throw new Error("The linked household could not be saved in this browser.");
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setBootstrapError(error instanceof Error ? error.message : "The household could not be loaded.");
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    authRouteAccess.isAllowed,
    household,
    householdBootstrapVersion,
    isCurrentSettingsPath,
    isProductionAuthEnabled,
    membership,
    session.status,
    session.user,
    shouldRepairMemberHouseholdShell,
  ]);

  useEffect(() => {
    if (
      !household ||
      !linkedRemoteHouseholdId ||
      !shouldHydrateRemoteMemberProfiles ||
      !isProductionAuthEnabled ||
      !authRouteAccess.isAllowed ||
      session.status !== "signed-in" ||
      !membership ||
      membership.status !== "active"
    ) {
      return;
    }

    let isActive = true;
    const adapter =
      getAuthBackendAdapter();

    void adapter
      .listRemoteHouseholdMembers(
        linkedRemoteHouseholdId
      )
      .then((remoteMembers) => {
        if (
          !isActive ||
          remoteMembers.length === 0
        ) {
          return;
        }

        const currentHousehold = loadHousehold();
        if (currentHousehold?.id !== household.id ||
          currentHousehold.authenticatedLink?.remoteHouseholdId !== linkedRemoteHouseholdId) return;
        const mergedMembers = reconcileHouseholdMembers(
          currentHousehold.members, remoteMembers, currentHousehold.id
        );

        if (
          JSON.stringify(mergedMembers) !== JSON.stringify(currentHousehold.members) &&
          saveHouseholdMembers(
            mergedMembers
          )
        ) {
          setHouseholdBootstrapVersion(
            (current) =>
              current + 1
          );
        }
      })
      .catch(() => {
        // Keep local member records unchanged if
        // remote alias hydration is unavailable.
      });

    return () => {
      isActive = false;
    };
  }, [
    authRouteAccess.isAllowed,
    household,
    isProductionAuthEnabled,
    linkedRemoteHouseholdId,
    membership,
    session.status,
    shouldHydrateRemoteMemberProfiles,
    memberRefreshVersion,
  ]);

  if (
    !household &&
    !isProductionAuthEnabled &&
    !isCurrentSettingsPath &&
    !isCurrentSettlementPath &&
    !isCurrentMemberTransparencyPath
  ) {
    return (
      <Navigate
        to="/household"
        replace
      />
    );
  }

  if (
    household &&
    isLockEnabled &&
    isLocked
  ) {
    return (
      <AppUnlockScreen
        householdName={
          household.householdName
        }
        onUnlock={() =>
          setIsLocked(false)
        }
      />
    );
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((current) => !current);
  };

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="app-main">
        <Header
          isMenuOpen={isSidebarOpen}
          onMenuToggle={toggleSidebar}
          onLock={
            household &&
            isLockEnabled
              ? () => {
                  setIsSidebarOpen(false);
                  setIsLocked(true);
                }
              : undefined
          }
        />

        <section
          className="app-beta-notice"
          aria-label="Public beta notice"
        >
          <strong>
            Public beta
          </strong>

          <span>
            Use low-risk data, sign in as the household admin for cloud-backed workflows, and export backups during public beta.
          </span>
        </section>

        <main className="app-content">
          <div className="page-container">
            {coreSnapshotRestore.backgroundError && (
              <p role="status" className="mb-3 rounded-md border border-amber-400 p-3 text-sm">
                Cloud refresh failed. Displayed records may be out of date. Retrying automatically.
              </p>
            )}
            {!household &&
            isCurrentSettingsPath ? (
              <Outlet />
            ) : isProductionAuthEnabled && session.status === "signed-in" &&
              membership?.status === "active" && (!household || shouldRepairMemberHouseholdShell) ? (
              <AuthRouteGatePanel
                access={{
                  status: "loading", isAllowed: false,
                  title: bootstrapError ? "Household Load Failed" : "Loading Household",
                  message: bootstrapError || "Loading your existing household and member profiles.",
                }}
                sessionLabel={session.status} roleLabel={membership.role}
                error={bootstrapError} isSignInAvailable={false}
                onSignIn={() => { void signIn(); }}
                onRefresh={() => { setBootstrapError(""); setHouseholdBootstrapVersion((value) => value + 1); }}
              />
            ) : householdPreferencesRestore
              .isRestoring ? (
              <AuthRouteGatePanel
                access={{
                  status: "loading",
                  isAllowed: false,
                  title:
                    "Loading Household",
                  message:
                    "HFOS is loading the authenticated household preferences before opening this page.",
                }}
                sessionLabel={
                  session.status
                }
                roleLabel={
                  membership?.role
                }
                error=""
                isSignInAvailable={false}
                onSignIn={() => {
                  void signIn();
                }}
                onRefresh={() => {
                  void refreshSession();
                }}
              />
            ) : householdPreferencesRestore
                .error ? (
              <AuthRouteGatePanel
                access={{
                  status:
                    "membership-required",
                  isAllowed: false,
                  title:
                    "Cloud Household Unavailable",
                  message:
                    "HFOS could not load the authenticated household preferences.",
                }}
                sessionLabel={
                  session.status
                }
                roleLabel={
                  membership?.role
                }
                error={
                  householdPreferencesRestore
                    .error
                }
                isSignInAvailable={false}
                onSignIn={() => {
                  void signIn();
                }}
                onRefresh={() => {
                  void refreshSession();
                }}
              />
            ) : coreSnapshotRestore.isRestoring ? (
              <AuthRouteGatePanel
                access={{
                  status: "loading",
                  isAllowed: false,
                  title:
                    "Loading Cloud Records",
                  message:
                    "HFOS is loading the authenticated household accounts and transactions before opening this page.",
                }}
                sessionLabel={
                  session.status
                }
                roleLabel={
                  membership?.role
                }
                error=""
                isSignInAvailable={false}
                onSignIn={() => {
                  void signIn();
                }}
                onRefresh={() => {
                  void refreshSession();
                }}
              />
            ) : coreSnapshotRestore.error ? (
              <AuthRouteGatePanel
                access={{
                  status:
                    "membership-required",
                  isAllowed: false,
                  title:
                    "Cloud Records Unavailable",
                  message:
                    "HFOS could not load the authenticated household accounts and transactions.",
                }}
                sessionLabel={
                  session.status
                }
                roleLabel={
                  membership?.role
                }
                error={
                  coreSnapshotRestore.error
                }
                isSignInAvailable={false}
                onSignIn={() => {
                  void signIn();
                }}
                onRefresh={() => {
                  void refreshSession();
                }}
              />
            ) : authRouteAccess.isAllowed ? (
              <Outlet />
            ) : (
              <AuthRouteGatePanel
                access={authRouteAccess}
                sessionLabel={
                  session.status
                }
                roleLabel={
                  membership?.role
                }
                error={authError}
                isSignInAvailable={
                  authRouteAccess.status ===
                    "signed-out" ||
                  authRouteAccess.status ===
                    "membership-required"
                }
                signInLabel="Sign in"
                onSignIn={() => {
                  navigate("/login");
                }}
                onRefresh={() => {
                  void refreshSession();
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function isSettingsPath(
  pathname: string
): boolean {
  return (
    pathname === "/app/settings" ||
    pathname.startsWith(
      "/app/settings/"
    )
  );
}

function isSettlementPath(
  pathname: string
): boolean {
  return (
    pathname === "/app/settlements" ||
    pathname.startsWith(
      "/app/settlements/"
    )
  );
}

function isMemberTransparencyPath(
  pathname: string
): boolean {
  const allowedPaths = [
    "/app/household-members",
    "/app/transactions",
    "/app/utilities",
    "/app/settlements",
    "/app/savings",
    "/app/analytics",
    "/app/help-center",
  ];

  return allowedPaths.some(
    (allowedPath) =>
      pathname === "/app" ||
      pathname === allowedPath ||
      pathname.startsWith(
        `${allowedPath}/`
      )
  );
}
