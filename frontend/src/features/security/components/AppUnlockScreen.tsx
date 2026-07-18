import "./AppUnlockScreen.css";

import {
  useState,
} from "react";
import type {
  FormEvent,
} from "react";

import {
  LockKeyhole,
} from "lucide-react";

import {
  verifyAppLockPin,
} from "../services/appLockService";

interface AppUnlockScreenProps {
  householdName: string;
  onUnlock: () => void;
}

export default function AppUnlockScreen({
  householdName,
  onUnlock,
}: AppUnlockScreenProps) {
  const [pin, setPin] =
    useState("");
  const [error, setError] =
    useState("");
  const [isChecking, setIsChecking] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setIsChecking(true);

    const isVerified =
      await verifyAppLockPin(pin);

    setIsChecking(false);

    if (!isVerified) {
      setError(
        "That PIN did not unlock HFOS."
      );
      setPin("");

      return;
    }

    onUnlock();
  }

  return (
    <main className="app-unlock">
      <form
        className="app-unlock__panel"
        onSubmit={handleSubmit}
      >
        <div className="app-unlock__icon">
          <LockKeyhole
            size={28}
            aria-hidden="true"
          />
        </div>

        <div>
          <h1>HFOS Locked</h1>

          <p>
            Enter your local PIN to open{" "}
            {householdName}.
          </p>
        </div>

        <label>
          <span>PIN</span>

          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            pattern="[0-9]*"
            value={pin}
            onChange={(event) => {
              setPin(event.target.value);
              setError("");
            }}
            autoFocus
          />
        </label>

        {error && (
          <p
            role="alert"
            className="app-unlock__error"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={
            isChecking ||
            pin.trim().length === 0
          }
        >
          {isChecking
            ? "Checking..."
            : "Unlock"}
        </button>
      </form>
    </main>
  );
}
