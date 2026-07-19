import {
  LogIn,
  LogOut,
  UserCircle,
} from "lucide-react";

import type {
  AuthSession,
} from "../models";

interface AuthSessionButtonProps {
  session: AuthSession;
  error?: string;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function AuthSessionButton({
  session,
  error,
  onSignIn,
  onSignOut,
}: AuthSessionButtonProps) {
  if (
    session.status === "disabled"
  ) {
    return null;
  }

  if (
    session.status === "signed-in" &&
    session.user
  ) {
    return (
      <button
        type="button"
        className="app-header__auth-button"
        title={
          error ||
          `Signed in as ${session.user.email}`
        }
        aria-label="Sign out"
        onClick={onSignOut}
      >
        <UserCircle
          size={18}
          aria-hidden="true"
        />
        <span>
          {
            session.user
              .displayName ??
            session.user.email
          }
        </span>
        <LogOut
          size={16}
          aria-hidden="true"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="app-header__auth-button"
      title={
        error ||
        "Future account sign in"
      }
      aria-label="Sign in"
      onClick={onSignIn}
      disabled={
        session.status === "loading"
      }
    >
      <LogIn
        size={17}
        aria-hidden="true"
      />
      <span>
        {session.status === "loading"
          ? "Checking"
          : "Sign in"}
      </span>
    </button>
  );
}
