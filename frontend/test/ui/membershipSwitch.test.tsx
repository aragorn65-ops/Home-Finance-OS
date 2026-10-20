import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useHouseholdMembership } from "../../src/features/auth/hooks/useHouseholdMembership";

const mocks = vi.hoisted(() => ({
  session: { status: "signed-in", user: { id: "rasha" } },
  listMemberships: vi.fn(),
}));
vi.mock("../../src/features/auth/hooks/useAuthSession", () => ({
  useAuthSession: () => ({ session: mocks.session }),
}));
vi.mock("../../src/features/auth/services/createAuthBackendAdapter", () => ({
  getAuthBackendAdapter: () => mocks,
}));
afterEach(cleanup);

it("requires household selection instead of choosing the first owner membership", async () => {
  mocks.session = { status: "signed-in", user: { id: "owner" } };
  mocks.listMemberships.mockResolvedValue(["empty-home", "real-home"].map((householdId) => ({
    id: householdId, userId: "owner", householdId, role: "owner", status: "active",
  })));
  const { result } = renderHook(() => useHouseholdMembership(""));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.membership).toBeUndefined();
  expect(result.current.allActiveMemberships).toHaveLength(2);
});

it("keeps the explicitly linked member household instead of switching to the newest membership", async () => {
  mocks.listMemberships.mockResolvedValue(["real-home", "new-home"].map((householdId) => ({
    id: householdId, userId: "owner", householdId, role: "member", status: "active",
    createdAt: new Date(householdId === "new-home" ? "2026-10-20" : "2026-01-01"),
  })));
  const { result } = renderHook(() => useHouseholdMembership("real-home"));
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.membership?.householdId).toBe("real-home");
});

it("never exposes the previous member while the next membership request is pending", async () => {
  const row = (id: string) => ({ id, userId: id, householdId: "home", role: "member", status: "active", createdAt: new Date() });
  mocks.session = { status: "signed-in", user: { id: "rasha" } };
  mocks.listMemberships.mockResolvedValue([row("rasha")]);
  const { result, rerender } = renderHook(() => useHouseholdMembership("home"));
  await waitFor(() => expect(result.current.membership?.userId).toBe("rasha"));
  let resolve!: (value: unknown[]) => void;
  mocks.listMemberships.mockReturnValue(new Promise((done) => { resolve = done; }));
  mocks.session = { status: "signed-in", user: { id: "lyn" } };
  rerender();
  expect(result.current.membership).toBeUndefined();
  expect(result.current.memberships).toEqual([]);
  expect(result.current.isLoading).toBe(true);
  await act(async () => { resolve([row("lyn")]); });
  expect(result.current.membership?.userId).toBe("lyn");
});
