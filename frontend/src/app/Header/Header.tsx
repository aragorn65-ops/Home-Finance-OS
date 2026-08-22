import "./Header.css";

import {
  Bell,
  LockKeyhole,
  Menu,
  Search,
} from "lucide-react";
import {
  useNavigate,
} from "react-router-dom";

import {
  AuthSessionButton,
  useHouseholdMembership,
} from "../../features/auth";
import {
  isAuthFeatureEnabled,
} from "../../config/auth";
import {
  loadHousehold,
} from "../../features/household/services/householdStorage";

interface HeaderProps {
  isMenuOpen?: boolean;
  onMenuToggle?: () => void;
  onLock?: () => void;
}

export default function Header({
  isMenuOpen = false,
  onMenuToggle,
  onLock,
}: HeaderProps) {
  const navigate = useNavigate();
  const household =
    loadHousehold();
  const authHouseholdId =
    household?.authenticatedLink
      ?.remoteHouseholdId ??
    household?.id ??
    "";
  const authSession =
    useHouseholdMembership(
      authHouseholdId
    );
  const showAuthSession =
    isAuthFeatureEnabled();
  const signedInEmail =
    authSession.session.user?.email
      ?.trim()
      .toLowerCase();
  const signedInMember =
    household?.members.find(
      (member) =>
        member.id ===
          authSession.membership
            ?.memberId ||
        member.remoteMemberId ===
          authSession.membership
            ?.memberId ||
        (
          signedInEmail &&
          member.email
            ?.trim()
            .toLowerCase() ===
            signedInEmail
        )
    );
  const signedInDisplayName =
    signedInMember?.displayName ??
    authSession.membership
      ?.memberDisplayName;

  return (
    <header className="app-header">
      <div className="app-header__leading">
        <button
          type="button"
          className="app-header__menu-button"
          aria-label={
            isMenuOpen
              ? "Close navigation"
              : "Open navigation"
          }
          aria-controls="app-sidebar"
          aria-expanded={isMenuOpen}
          onClick={onMenuToggle}
        >
          <Menu
            size={20}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        className="app-header__actions"
        aria-label="Application actions"
      >
        <button
          type="button"
          className="app-header__action-button"
          aria-label="Search"
          title="Search is not available yet"
        >
          <Search
            size={19}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="app-header__action-button"
          aria-label="Notifications"
          title="Notifications are not available yet"
        >
          <Bell
            size={19}
            aria-hidden="true"
          />
        </button>

        {onLock && (
          <button
            type="button"
            className="app-header__action-button"
            aria-label="Lock HFOS"
            title="Lock HFOS"
            onClick={onLock}
          >
            <LockKeyhole
              size={19}
              aria-hidden="true"
            />
          </button>
        )}

        {showAuthSession && (
          <AuthSessionButton
            session={
              authSession.session
            }
            displayName={
              signedInDisplayName
            }
            error={authSession.error}
            onSignIn={
              () => {
                navigate("/app/settings");
              }
            }
            onSignOut={
              authSession.signOut
            }
          />
        )}
      </div>
    </header>
  );
}
