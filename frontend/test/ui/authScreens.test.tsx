import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SignInPage from "../../src/features/auth/pages/SignInPage";
import PasswordPage from "../../src/features/auth/pages/PasswordPage";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(), signOut: vi.fn(), requestPasswordReset: vi.fn(),
  getCurrentUser: vi.fn(), getPasswordRecoveryUser: vi.fn(), updatePassword: vi.fn(),
}));
vi.mock("../../src/features/auth/hooks/useAuthSession", () => ({
  useAuthSession: () => ({ session: { status: "signed-out" }, error: "", ...mocks }),
}));
vi.mock("../../src/config/auth", () => ({
  authFeatureConfig: { enabled: true, provider: "supabase" },
}));
vi.mock("../../src/features/auth/services/createAuthBackendAdapter", () => ({
  getAuthBackendAdapter: () => mocks,
}));

function login(path = "/login") {
  render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/login" element={<SignInPage />} />
    <Route path="/app" element={<h1>Household</h1>} />
  </Routes></MemoryRouter>);
}
function password(recovery = false) {
  render(<MemoryRouter><PasswordPage recovery={recovery} /></MemoryRouter>);
}
beforeEach(() => {
  vi.resetAllMocks();
  window.history.replaceState({}, "", "/");
  mocks.getCurrentUser.mockResolvedValue({ id: "rasha-id", email: "rasha@example.com" });
  mocks.getPasswordRecoveryUser.mockResolvedValue({ id: "rasha-id", email: "rasha@example.com" });
  mocks.updatePassword.mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("login form", () => {
  it("submits a password without modifying it and opens the app on success", async () => {
    mocks.signIn.mockResolvedValue(true);
    login();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "rasha@example.com");
    await user.type(screen.getByLabelText("Password", { exact: true }), " a secret ");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password", { exact: true }).getAttribute("type")).toBe("text");
    await user.click(screen.getByRole("button", { name: "Sign in", exact: true }));
    expect(mocks.signIn).toHaveBeenCalledWith({ method: "password", email: "rasha@example.com", password: " a secret " });
    expect(await screen.findByRole("heading", { name: "Household" })).toBeTruthy();
  });

  it("does not navigate or report success when authentication fails", async () => {
    mocks.signIn.mockResolvedValue(false);
    login();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "rasha@example.com");
    await user.type(screen.getByLabelText("Password", { exact: true }), "wrong password");
    await user.click(screen.getByRole("button", { name: "Sign in", exact: true }));
    expect(screen.queryByRole("heading", { name: "Household" })).toBeNull();
    expect((screen.getByLabelText("Password", { exact: true }) as HTMLInputElement).value).toBe("");
  });

  it("requests recovery with the fixed local callback and a non-enumerating message", async () => {
    mocks.requestPasswordReset.mockResolvedValue(undefined);
    login("/login?mode=recovery");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "rasha@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(mocks.requestPasswordReset).toHaveBeenCalledWith("rasha@example.com", "http://localhost:5173/reset-password");
    expect(await screen.findByRole("status")).toHaveProperty("textContent", "If this email has an account, a password reset link will arrive shortly.");
  });

  it("shows recovery failure and never reports that a link was sent", async () => {
    mocks.requestPasswordReset.mockRejectedValue(new Error("network unavailable"));
    login("/login?mode=recovery");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "rasha@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps the magic link as an explicit fallback and prevents duplicate submissions", async () => {
    let finish!: (value: boolean) => void;
    mocks.signIn.mockImplementation(() => new Promise<boolean>((resolve) => { finish = resolve; }));
    login();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Use email link" }));
    await user.type(screen.getByLabelText("Email"), "rasha@example.com");
    await user.dblClick(screen.getByRole("button", { name: "Send sign-in link" }));
    expect(mocks.signIn).toHaveBeenCalledTimes(1);
    expect(mocks.signIn).toHaveBeenCalledWith({ method: "magic-link", email: "rasha@example.com", redirectTo: "http://localhost:5173/login" });
    finish(true);
    expect(await screen.findByRole("status")).toBeTruthy();
  });
});

describe("password setup and recovery", () => {
  it("requires matching passwords and preserves the existing account ID", async () => {
    password();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("New password"), "new password");
    await user.type(screen.getByLabelText("Confirm password"), "different password");
    await user.click(screen.getByRole("button", { name: "Save password" }));
    expect(screen.getByRole("alert").textContent).toBe("Passwords do not match.");
    expect(mocks.updatePassword).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText("Confirm password"));
    await user.type(screen.getByLabelText("Confirm password"), "new password");
    await user.click(screen.getByRole("button", { name: "Save password" }));
    expect(mocks.updatePassword).toHaveBeenCalledWith("new password", "rasha-id");
    expect(await screen.findByRole("heading", { name: "Password updated" })).toBeTruthy();
  });

  it("does not accept an expired callback even with a different signed-in account", async () => {
    window.history.replaceState({}, "", "/reset-password#error=access_denied&error_code=otp_expired");
    password(true);
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "This reset link is invalid or expired. Request a new link.");
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(mocks.getPasswordRecoveryUser).not.toHaveBeenCalled();
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
  });

  it("requires verified recovery and does not use the ordinary cached account", async () => {
    mocks.getPasswordRecoveryUser.mockResolvedValue(undefined);
    password(true);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(mocks.getCurrentUser).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("New password")).toBeNull();
  });

  it("keeps a failed password update open without a success message", async () => {
    mocks.updatePassword.mockRejectedValue(new Error("rejected"));
    password(true);
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("New password"), "new password");
    await user.type(screen.getByLabelText("Confirm password"), "new password");
    await user.click(screen.getByRole("button", { name: "Save password" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Password updated" })).toBeNull();
    await waitFor(() => expect((screen.getByRole("button", { name: "Save password" }) as HTMLButtonElement).disabled).toBe(false));
  });
});
