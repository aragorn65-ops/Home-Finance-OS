import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PasswordRecoveryGate from "../../src/features/auth/components/PasswordRecoveryGate";

const state = vi.hoisted(() => ({
  session: { status: "signed-in", requiresPasswordUpdate: true },
}));
vi.mock("../../src/features/auth/hooks/useAuthSession", () => ({
  useAuthSession: () => state,
}));
vi.mock("../../src/config/auth", () => ({
  authFeatureConfig: { enabled: true, provider: "supabase" },
}));
afterEach(cleanup);

it("redirects a recovery session before protected content mounts", async () => {
  const mount = vi.fn();
  function Protected() { mount(); return <p>Financial records</p>; }
  state.session = { status: "signed-in", requiresPasswordUpdate: true };
  render(<MemoryRouter initialEntries={["/app"]}><PasswordRecoveryGate><Routes>
    <Route path="/app" element={<Protected />} />
    <Route path="/reset-password" element={<h1>Reset password</h1>} />
  </Routes></PasswordRecoveryGate></MemoryRouter>);
  expect(await screen.findByRole("heading", { name: "Reset password" })).toBeTruthy();
  expect(mount).not.toHaveBeenCalled();
});

it("allows a new reset request without escaping the recovery guard", () => {
  state.session = { status: "signed-in", requiresPasswordUpdate: true };
  render(<MemoryRouter initialEntries={["/login?mode=recovery"]}>
    <PasswordRecoveryGate><h1>Request another link</h1></PasswordRecoveryGate>
  </MemoryRouter>);
  expect(screen.getByRole("heading", { name: "Request another link" })).toBeTruthy();
});

it("does not mount children while the initial session is unresolved", () => {
  state.session = { status: "loading", requiresPasswordUpdate: false };
  render(<MemoryRouter><PasswordRecoveryGate><p>Financial records</p></PasswordRecoveryGate></MemoryRouter>);
  expect(screen.getByRole("status")).toBeTruthy();
  expect(screen.queryByText("Financial records")).toBeNull();
});
