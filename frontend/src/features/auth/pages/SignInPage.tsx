import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
import Brand from "../../../shared/branding";
import { authFeatureConfig } from "../../../config/auth";
import { useAuthSession } from "../hooks/useAuthSession";
import { getAuthBackendAdapter } from "../services/createAuthBackendAdapter";
import "./SignInPage.css";

export default function SignInPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { session, signIn, signOut, error: sessionError } = useAuthSession();
  const [mode, setMode] = useState<"password" | "recovery" | "magic">(
    params.get("mode") === "recovery" ? "recovery" : "password"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const enabled = authFeatureConfig.enabled && authFeatureConfig.provider === "supabase";

  useEffect(() => { document.title = "Sign in | Home Finance OS"; }, []);

  function changeMode(next: typeof mode) {
    setMode(next);
    setPassword("");
    setMessage("");
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      if (mode === "recovery") {
        await getAuthBackendAdapter().requestPasswordReset(
          email,
          new URL(`${import.meta.env.BASE_URL}reset-password`, window.location.origin).href
        );
        setMessage("If this email has an account, a password reset link will arrive shortly.");
      } else {
        const success = await signIn(mode === "password"
          ? { method: "password", email, password }
          : { method: "magic-link", email, redirectTo: new URL(`${import.meta.env.BASE_URL}login`, window.location.origin).href });
        setPassword("");
        if (success && mode === "password") navigate("/app", { replace: true });
        else if (success) setMessage("If this email has an account, a sign-in link will arrive shortly.");
      }
    } catch {
      setError("Unable to send the request. Please try again later.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <main className="auth-screen">
    <section className="auth-screen__content" aria-labelledby="signin-heading">
      <div className="auth-screen__brand" role="img" aria-label="Home Finance OS"><Brand /></div>
      <h1 id="signin-heading">{mode === "recovery" ? "Reset password" : "Sign in"}</h1>
      {!enabled && <p role="status">Cloud sign-in is not enabled in this preview.</p>}
      {(error || sessionError) && <p className="auth-screen__error" role="alert">{error || sessionError}</p>}
      {message && <p className="auth-screen__success" role="status">{message}</p>}
      {session.status === "signed-in" && mode !== "recovery" ? <>
        <p>Signed in as {session.user?.email}</p>
        <Link className="auth-screen__primary" to="/app">Continue</Link>
        <Link to="/account/password">Set or change password</Link>
        <button type="button" disabled={busy} onClick={() => { void signOut(); }}>Sign out</button>
      </> : <form onSubmit={(event) => { void submit(event); }}>
        <fieldset disabled={!enabled || busy || session.status === "loading"}>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" autoComplete="username"
            autoCapitalize="none" spellCheck={false} required value={email}
            onChange={(event) => setEmail(event.target.value)} />
          {mode === "password" && <>
            <label htmlFor="login-password">Password</label>
            <div className="auth-screen__password">
              <input id="login-password" name="password" type={visible ? "text" : "password"}
                autoComplete="current-password" required value={password}
                onChange={(event) => setPassword(event.target.value)} />
              <button type="button" aria-label={visible ? "Hide password" : "Show password"}
                title={visible ? "Hide password" : "Show password"} aria-pressed={visible}
                onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </>}
          <button type="submit" className="auth-screen__primary">
            {mode === "password" ? <LogIn size={18} /> : <Mail size={18} />}
            {busy ? "Please wait..." : mode === "password" ? "Sign in" : mode === "recovery" ? "Send reset link" : "Send sign-in link"}
          </button>
          <div className="auth-screen__links">
            {mode !== "password" && <button type="button" onClick={() => changeMode("password")}>Use password</button>}
            {mode !== "recovery" && <button type="button" onClick={() => changeMode("recovery")}>Forgot password?</button>}
            {mode !== "magic" && <button type="button" onClick={() => changeMode("magic")}>Use email link</button>}
          </div>
        </fieldset>
      </form>}
      <Link to="/">Home</Link>
    </section>
  </main>;
}
