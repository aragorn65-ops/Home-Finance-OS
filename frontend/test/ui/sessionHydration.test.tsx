import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useLinkedCoreSnapshotRestore } from "../../src/features/auth/hooks/useLinkedCoreSnapshotRestore";

const mocks = vi.hoisted(() => ({
  restore: vi.fn(), payments: vi.fn(), adapter: {},
}));
vi.mock("../../src/config/auth", () => ({ isAuthFeatureEnabled: () => true }));
vi.mock("../../src/features/auth/services", () => ({
  getAuthBackendAdapter: () => mocks.adapter,
  restoreLinkedRemoteCoreSnapshot: mocks.restore,
}));
vi.mock("../../src/features/auth/services/browserCoreSnapshotLocalWriter", () => ({
  browserCoreSnapshotLocalWriter: {},
}));
vi.mock("../../src/features/auth/services/coreSnapshotRefreshFallback", () => ({
  subscribeToCoreSnapshotRefreshFallback: () => () => {},
}));
vi.mock("../../src/features/settlements/services/remoteSettlementSync", () => ({
  refreshRemoteSettlementCache: mocks.payments,
}));
const options = {
  household: { id: "local", authenticatedLink: { remoteHouseholdId: "remote", ownerMemberId: "owner" } },
  sessionStatus: "signed-in" as const, role: "member" as const,
  isRouteAllowed: true, isSettingsRoute: false,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.restore.mockResolvedValue({ status: "restored" });
  mocks.payments.mockResolvedValue(true);
});
afterEach(cleanup);

it("holds the initial page gate until payment applications have loaded", async () => {
  let resolve!: (value: boolean) => void;
  mocks.payments.mockReturnValue(new Promise<boolean>((done) => { resolve = done; }));
  const { result } = renderHook(() => useLinkedCoreSnapshotRestore({ ...options, userId: "rasha" }));
  expect(result.current.isRestoring).toBe(true);
  await waitFor(() => expect(mocks.payments).toHaveBeenCalledTimes(1));
  expect(result.current.isRestoring).toBe(true);
  await act(async () => { resolve(true); });
  expect(result.current.isRestoring).toBe(false);
});

it("reloads for another member even when household and role are unchanged", async () => {
  const { result, rerender } = renderHook(({ userId }) =>
    useLinkedCoreSnapshotRestore({ ...options, userId }), { initialProps: { userId: "rasha" } });
  await waitFor(() => expect(result.current.isRestoring).toBe(false));
  const previous = mocks.restore.mock.calls[0][0].isCurrent;
  let resolve!: (value: { status: string }) => void;
  mocks.restore.mockReturnValue(new Promise((done) => { resolve = done; }));
  rerender({ userId: "lyn" });
  expect(result.current.isRestoring).toBe(true);
  expect(previous()).toBe(false);
  await act(async () => { resolve({ status: "restored" }); });
  await waitFor(() => expect(result.current.isRestoring).toBe(false));
  expect(mocks.payments).toHaveBeenCalledTimes(2);
});

it("fails closed rather than rendering unpaid balances when payment loading fails", async () => {
  mocks.payments.mockRejectedValue(new Error("Payment links could not be loaded"));
  const { result } = renderHook(() => useLinkedCoreSnapshotRestore({ ...options, userId: "rasha" }));
  await waitFor(() => expect(result.current.error).toBe("Payment links could not be loaded"));
  expect(result.current.isRestoring).toBe(false);
});

it("invalidates an in-flight payment refresh when the session screen unmounts", async () => {
  mocks.payments.mockReturnValue(new Promise(() => {}));
  const { unmount } = renderHook(() => useLinkedCoreSnapshotRestore({ ...options, userId: "rasha" }));
  await waitFor(() => expect(mocks.payments).toHaveBeenCalledTimes(1));
  const isCurrent = mocks.payments.mock.calls[0][3];
  expect(isCurrent()).toBe(true);
  unmount();
  expect(isCurrent()).toBe(false);
});
