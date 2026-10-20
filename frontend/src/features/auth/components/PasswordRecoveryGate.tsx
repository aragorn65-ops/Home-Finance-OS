import { Fragment, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthSession } from "../hooks/useAuthSession";
import { authFeatureConfig } from "../../../config/auth";

export default function PasswordRecoveryGate({ children }: { children: ReactNode }) {
  const { session } = useAuthSession();
  const location = useLocation();
  if (session.status === "loading") {
    return <p role="status" className="px-6 py-8">Checking your session...</p>;
  }
  const requestingRecovery = location.pathname === "/login" &&
    new URLSearchParams(location.search).get("mode") === "recovery";
  if (session.requiresPasswordUpdate && location.pathname !== "/reset-password" && !requestingRecovery) {
    return <Navigate to="/reset-password" replace />;
  }
  if (location.pathname === "/" && session.status === "signed-out" &&
      authFeatureConfig.enabled && authFeatureConfig.provider === "supabase") {
    return <Navigate to="/login" replace />;
  }
  // Remount session-bound hooks on identity changes, including member-to-member switches.
  return <Fragment key={session.user?.id ?? session.status}>{children}</Fragment>;
}
