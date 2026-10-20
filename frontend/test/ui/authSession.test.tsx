import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useAuthSession } from "../../src/features/auth/hooks/useAuthSession";
const adapter = vi.hoisted(() => ({ getSession: vi.fn(), signIn: vi.fn() }));
vi.mock("../../src/features/auth/services/createAuthBackendAdapter", () => ({
  getAuthBackendAdapter: () => adapter,
}));
beforeEach(() => {
  vi.resetAllMocks();
  adapter.getSession.mockResolvedValue({ status: "signed-out" });
});
afterEach(cleanup);

it("returns false and an actionable error for a rejected password", async () => {
  adapter.signIn.mockRejectedValue(new Error("provider detail"));
  const { result } = renderHook(useAuthSession);
  await waitFor(() => expect(result.current.session.status).toBe("signed-out"));
  let success;
  await act(async () => {
    success = await result.current.signIn({ method: "password", email: "rasha@example.com", password: "bad password" });
  });
  expect(success).toBe(false);
  expect(result.current.error).toBe("Unable to sign in. Check your email and password and try again.");
});

it("does not report success for a failed magic link request", async () => {
  adapter.signIn.mockRejectedValue(new Error("rate limited"));
  const { result } = renderHook(useAuthSession);
  await waitFor(() => expect(result.current.session.status).toBe("signed-out"));
  let success;
  await act(async () => { success = await result.current.signIn({ email: "rasha@example.com" }); });
  expect(success).toBe(false);
  expect(result.current.error).toBe("Unable to request sign-in. Please try again later.");
});
