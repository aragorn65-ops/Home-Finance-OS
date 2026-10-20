import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import Brand from "../../../shared/branding";
import type { AuthUser } from "../models";
import { getAuthBackendAdapter } from "../services/createAuthBackendAdapter";
import { useAuthSession } from "../hooks/useAuthSession";
import "./SignInPage.css";

export default function PasswordPage({ recovery = false }: { recovery?: boolean }) {
  const { session } = useAuthSession();
  const [user, setUser] = useState<AuthUser>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [callbackFailed] = useState(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    return ["error", "error_code", "error_description"].some((key) => hash.has(key) || query.has(key));
  });

  useEffect(() => {
    document.title = "Set password | Home Finance OS";
    if (session.status === "loading" || complete) return;
    let cancelled = false;
    const adapter = getAuthBackendAdapter();
    void (async () => {
      try {
        const current = callbackFailed ? undefined : await (
          recovery ? adapter.getPasswordRecoveryUser() : adapter.getCurrentUser()
        );
        if (!cancelled) {
          setUser(current);
          if (current) setError("");
          if (!current) setError(recovery
            ? "This reset link is invalid or expired. Request a new link."
            : "Sign in before setting your password.");
        }
      } catch {
        if (!cancelled) setError("Your session could not be verified. Sign in or request a new reset link.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [recovery, callbackFailed, complete, session.status, session.user?.id, session.requiresPasswordUpdate]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || pending.current) return;
    setError("");
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      await getAuthBackendAdapter().updatePassword(password, user.id);
      setPassword("");
      setConfirmation("");
      setComplete(true);
      window.dispatchEvent(new Event("hfos-auth-session-changed"));
    } catch {
      setError("Password was not updated. Check your session and password requirements, then try again.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <main className="auth-screen">
    <section className="auth-screen__content" aria-labelledby="password-heading">
      <div className="auth-screen__brand" role="img" aria-label="Home Finance OS"><Brand /></div>
      <h1 id="password-heading">{complete ? "Password updated" : "Set password"}</h1>
      {loading && <p role="status">Verifying your session...</p>}
      {error && <p className="auth-screen__error" role="alert">{error}</p>}
      {complete ? <>
        <p className="auth-screen__success" role="status">Your password has been saved.</p>
        <Link className="auth-screen__primary" to="/app">Continue</Link>
      </> : user && <form onSubmit={(event) => { void submit(event); }}>
        <p>{user.email}</p>
        <fieldset disabled={busy}>
          <label htmlFor="new-password">New password</label>
          <div className="auth-screen__password">
            <input id="new-password" name="new-password" type={visible ? "text" : "password"}
              autoComplete="new-password" minLength={8} required value={password}
              aria-describedby="password-requirements"
              onChange={(event) => setPassword(event.target.value)} />
            <button type="button" aria-label={visible ? "Hide password" : "Show password"}
              title={visible ? "Hide password" : "Show password"} aria-pressed={visible}
              onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <p id="password-requirements">At least 8 characters.</p>
          <label htmlFor="confirm-password">Confirm password</label>
          <input id="confirm-password" name="confirm-password" type={visible ? "text" : "password"}
            autoComplete="new-password" minLength={8} required value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)} />
          <button className="auth-screen__primary" type="submit"><KeyRound size={18} />
            {busy ? "Saving..." : "Save password"}</button>
        </fieldset>
      </form>}
      {!complete && !loading && !user && <Link to="/login?mode=recovery">Request a new reset link</Link>}
      {!recovery && <Link to="/login">Back to sign in</Link>}
    </section>
  </main>;
}
